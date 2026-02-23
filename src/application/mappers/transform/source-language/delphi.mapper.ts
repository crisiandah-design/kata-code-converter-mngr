import { ISourceLanguageMapper } from '../../../../domain/interfaces/i-source-language-mapper.interface';
import { IRNode } from '../../../../domain/models/intermediate-representation.model';
import {
	SourceLanguageResponseModel,
	RuleLog,
} from '../../../../domain/transform/transform-response.model';
import { TRANSFORM_ERRORS } from '../../../../domain/constants/tranform-error.constants';
import {
	DESCRIPTION_RULES,
	TRANSFORM_RULES,
} from '../../../../domain/constants/transform-rules.constants';

type RuleHandler = (line: string, state: ParserState, root?: IRNode) => boolean;
interface Rule {
	name: string;
	description: string;
	predicate: (line: string) => boolean;
	handler: RuleHandler;
}
interface ParserState {
	currentLoop: IRNode | null;
	currentIf: IRNode | null;
	currentIfElse: boolean;
}

export class DelphiMapper implements ISourceLanguageMapper {
	private readonly RE_FOR = /^for\s+/i;
	private readonly RE_FOR_LOOP = /for\s+(\w+)\s*:=\s*(\d+)\s+to\s+(\w+)/i;
	private readonly RE_IF = /^if\s+/i;
	private readonly RE_IF_COND = /if\s+(.+?)\s*(>=|<=|<>|=|>|<)\s*(.+?)\s*then/i;
	private readonly RE_ELSE = /^else\b/i;
	private readonly RE_END = /^end\b/i;
	private readonly RE_WRITELN = /\bwriteln\s*\(/i;
	private readonly RE_WRITELN_FULL = /writeln\s*\((.*)\)\s*;?/i;
	private readonly RE_ASSIGN = /:=/;
	private readonly RE_ASSIGN_FULL = /^(\w+)\s*:=\s*(.+);?$/;
	private readonly RE_ADD = /^(\w+)\s*\+\s*(\w+)$/;
	private readonly RE_VAR_DECL = /^([\w\s,]+)\s*:\s*\w+/i;
	private readonly RE_VAR_MARKER = /^var\b/i;
	private readonly RE_CALL = /^[a-zA-Z_]\w*\s*\(.*\);?$/i;

	public parse(source: string): SourceLanguageResponseModel {
		const lines = source.split('\n');
		const root: IRNode = { type: 'Program', children: [] };
		const state: ParserState = { currentLoop: null, currentIf: null, currentIfElse: false };
		const detail: RuleLog[] = [];

		lines.forEach((raw, index) => {
			const line = raw.trim();
			const lineNumber = index + 1;
			if (!line) return;

			const matchedRule = this.rules.find((rule) => rule.predicate(line));
			if (matchedRule) {
				try {
					const applied = matchedRule.handler(line, state, root) === true;
					if (applied)
						detail.push({
							ruleName: matchedRule.name,
							description: matchedRule.description,
							line: lineNumber,
						});
					else
						detail.push({
							ruleName: matchedRule.name,
							description: `${TRANSFORM_ERRORS.NO_RECORD} ${line}`,
							line: lineNumber,
						});
				} catch (err: any) {
					detail.push({
						ruleName: matchedRule.name,
						description: `${TRANSFORM_ERRORS.APPLY_RULE} ${err?.message || String(err)}`,
						line: lineNumber,
					});
				}
			} else {
				detail.push({
					ruleName: 'NoMatch',
					description: `${TRANSFORM_ERRORS.NO_RULE} ${line}`,
					line: lineNumber,
				});
			}
		});

		return { intermediateRepresentation: { root }, detail };
	}

	private push(node: IRNode, state: ParserState, root: IRNode): void {
		if (!node) return;
		if (state.currentIf && state.currentIfElse) {
			(state.currentIf as any).elseChildren = (state.currentIf as any).elseChildren || [];
			(state.currentIf as any).elseChildren.push(node);
			return;
		}
		if (state.currentIf) {
			state.currentIf.children = state.currentIf.children || [];
			state.currentIf.children.push(node);
			return;
		}
		if (state.currentLoop) {
			state.currentLoop.children = state.currentLoop.children || [];
			state.currentLoop.children.push(node);
			return;
		}
		root.children = root.children || [];
		root.children.push(node);
	}

	// --- Simple Delphi detectors ---
	private isFor(line: string): boolean {
		return this.RE_FOR.test(line);
	}
	private isIf(line: string): boolean {
		return this.RE_IF.test(line);
	}
	private isElse(line: string): boolean {
		return this.RE_ELSE.test(line);
	}
	private isEnd(line: string): boolean {
		return this.RE_END.test(line);
	}
	private isWriteln(line: string): boolean {
		return this.RE_WRITELN.test(line);
	}
	private isAssignment(line: string): boolean {
		return this.RE_ASSIGN.test(line);
	}
	private isVarDecl(line: string): boolean {
		return this.RE_VAR_MARKER.test(line) || this.RE_VAR_DECL.test(line);
	}
	private isCall(line: string): boolean {
		return this.RE_CALL.test(line);
	}

	// --- Handlers ---
	private handleFor(line: string, state: ParserState, root?: IRNode): boolean {
		if (!root) return false;
		// parse: for I := 1 to LIMIT do
		const match = line.match(this.RE_FOR_LOOP);
		const iterator = match ? match[1] : 'i';
		const from = match ? Number(match[2]) : 0;
		const until = match ? match[3] : 'LIMIT';
		const node: IRNode = {
			type: 'ForLoop',
			value: { iterator, from, until, step: 1 },
			children: [],
		};
		root.children = root.children || [];
		root.children.push(node);
		state.currentLoop = node;
		return true;
	}

	private handleIf(line: string, state: ParserState, root?: IRNode): boolean {
		// parse: if LEFT OP RIGHT then
		const match = line.match(this.RE_IF_COND);
		const left = match ? match[1].trim() : 'condLeft';
		const operator = match ? match[2] : '>';
		let right: any = match ? match[3].trim() : undefined;
		if (right && /^\d+$/.test(right)) right = Number(right);
		const node: IRNode = { type: 'IfStatement', value: { left, operator, right }, children: [] };
		if (state.currentLoop) {
			state.currentLoop.children = state.currentLoop.children || [];
			state.currentLoop.children.push(node);
		} else if (root) {
			root.children = root.children || [];
			root.children.push(node);
		}
		state.currentIf = node;
		state.currentIfElse = false;
		return true;
	}

	private handleElse(_line: string, state: ParserState): boolean {
		if (!state.currentIf) return false;
		(state.currentIf as any).elseChildren = (state.currentIf as any).elseChildren || [];
		state.currentIfElse = true;
		return true;
	}

	private handleEnd(_line: string, state: ParserState): boolean {
		// finish current block
		if (state.currentIf && state.currentIfElse) {
			state.currentIfElse = false;
			state.currentIf = null;
			return true;
		}
		if (state.currentLoop) {
			state.currentLoop = null;
			return true;
		}
		return true;
	}

	private handleWriteln(line: string, state: ParserState, root?: IRNode): boolean {
		if (!root) return false;
		// parse Writeln('text', VAR)
		const match = line.match(this.RE_WRITELN_FULL);
		if (!match) return false;
		const inside = match[1];
		// split by comma not inside quotes
		const parts: string[] = [];
		let cur = '';
		let inQuotes = false;
		for (let pos = 0; pos < inside.length; pos++) {
			const ch = inside[pos];
			if (ch === "'") inQuotes = !inQuotes;
			if (ch === ',' && !inQuotes) {
				parts.push(cur.trim());
				cur = '';
				continue;
			}
			cur += ch;
		}
		if (cur) parts.push(cur.trim());
		const textPart = parts[0] || '';
		let text = textPart;
		const args = parts
			.slice(1)
			.map((p) => p.replace(/;$/, '').trim())
			.filter(Boolean);
		// remove surrounding quotes if present
		if (/^'.*'$/.test(text)) text = text.slice(1, -1);
		const node: IRNode = { type: 'PrintStatement', value: { text, args } };
		this.push(node, state, root);
		return true;
	}

	private handleAssignment(line: string, state: ParserState, root?: IRNode): boolean {
		if (!root) return false;
		// parse: TARGET := expr;
		const match = line.match(this.RE_ASSIGN_FULL);
		if (!match) return false;
		const target = match[1];
		const expr = match[2].trim();
		// detect addition: A + B
		const addMatch = expr.match(this.RE_ADD);
		if (addMatch) {
			// If it's like TOTAL + I and target is TOTAL, produce ADD
			const operands = [addMatch[2]];
			const node: IRNode = {
				type: 'AssignmentStatement',
				value: { target, operator: 'ADD', operands },
			};
			this.push(node, state, root);
			return true;
		}
		// numeric literal?
		const num = /^\d+$/.test(expr) ? Number(expr) : expr.replace(/;$/, '');
		const node: IRNode = { type: 'AssignmentStatement', value: { target, source: num } };
		this.push(node, state, root);
		return true;
	}

	private handleVarDecl(line: string, _state: ParserState, root?: IRNode): boolean {
		if (!root) return false;
		// handle 'var' marker or 'I, TOTAL, LIMIT: Integer;'
		if (this.RE_VAR_MARKER.test(line)) return true;
		// capture names before ':'
		const match = line.match(this.RE_VAR_DECL);
		if (!match) return false;
		const names = match[1]
			.split(',')
			.map((n) => n.trim())
			.filter(Boolean);
		root.children = root.children || [];
		for (const name of names) {
			const node: IRNode = { type: 'VarDeclaration', value: { name } };
			root.children.push(node);
		}
		return true;
	}

	private handleCall(line: string, state: ParserState, root?: IRNode): boolean {
		if (!root) return false;
		const node: IRNode = { type: 'CallStatement', value: line };
		this.push(node, state, root);
		return true;
	}

	private get rules(): Rule[] {
		return [
			{
				name: TRANSFORM_RULES.DELPHI.FOR,
				description: DESCRIPTION_RULES.DELPHI.FOR,
				predicate: (line) => this.isFor(line),
				handler: (line, state, root) => this.handleFor(line, state, root),
			},
			{
				name: TRANSFORM_RULES.DELPHI.IF,
				description: DESCRIPTION_RULES.DELPHI.IF,
				predicate: (line) => this.isIf(line),
				handler: (line, state, root) => this.handleIf(line, state, root),
			},
			{
				name: TRANSFORM_RULES.DELPHI.ELSE,
				description: DESCRIPTION_RULES.DELPHI.ELSE,
				predicate: (line) => this.isElse(line),
				handler: (line, state) => this.handleElse(line, state),
			},
			{
				name: TRANSFORM_RULES.DELPHI.END_IF,
				description: DESCRIPTION_RULES.DELPHI.END_IF,
				predicate: (line) => this.isEnd(line),
				handler: (line, state) => this.handleEnd(line, state),
			},
			{
				name: TRANSFORM_RULES.DELPHI.DISPLAY,
				description: DESCRIPTION_RULES.DELPHI.DISPLAY,
				predicate: (line) => this.isWriteln(line),
				handler: (line, state, root) => this.handleWriteln(line, state, root),
			},
			{
				name: TRANSFORM_RULES.DELPHI.ASSIGNMENT,
				description: DESCRIPTION_RULES.DELPHI.ASSIGNMENT,
				predicate: (line) => this.isAssignment(line),
				handler: (line, state, root) => this.handleAssignment(line, state, root),
			},
			{
				name: TRANSFORM_RULES.DELPHI.VAR_DECLARATION,
				description: DESCRIPTION_RULES.DELPHI.VAR_DECLARATION,
				predicate: (line) => this.isVarDecl(line),
				handler: (line, state, root) => this.handleVarDecl(line, state, root),
			},
			{
				name: TRANSFORM_RULES.DELPHI.CALL,
				description: DESCRIPTION_RULES.DELPHI.CALL,
				predicate: (line) => this.isCall(line),
				handler: (line, state, root) => this.handleCall(line, state, root),
			},
		];
	}
}
