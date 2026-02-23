import {
	parseDisplay,
	parseIf,
	parsePerform,
	parseAssignment,
	parseVarDeclaration,
	parseCall,
	parseAdd,
} from '../../../../domain/parsers/cobol-rules';
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

export class CobolMapper implements ISourceLanguageMapper {
	public parse(source: string): SourceLanguageResponseModel {
		const lines = this.splitToLines(source);
		const root: IRNode = { type: 'Program', children: [] };

		const parserState: ParserState = { currentLoop: null, currentIf: null, currentIfElse: false };
		const detail: RuleLog[] = [];

		for (let index = 0; index < lines.length; index++) {
			const rawLine = lines[index];
			const currentLine = rawLine.trim();
			const lineNumber = index + 1;
			if (!currentLine) continue;
			if (this.isIgnorableLine(currentLine)) continue;

			let matchedRule = false;
			for (const rule of this.rules) {
				if (rule.predicate(currentLine)) {
					matchedRule = true;
					try {
						const applied = rule.handler(currentLine, parserState, root) === true;
						if (applied) {
							detail.push({ ruleName: rule.name, description: rule.description, line: lineNumber });
						} else {
							detail.push({
								ruleName: rule.name,
								description: `${TRANSFORM_ERRORS.NO_RECORD} ${currentLine}`,
								line: lineNumber,
							});
						}
					} catch (err: any) {
						detail.push({
							ruleName: rule.name,
							description: `${TRANSFORM_ERRORS.APPLY_RULE} ${err?.message || String(err)}`,
							line: lineNumber,
						});
					}
					break;
				}
			}

			if (!matchedRule) {
				detail.push({
					ruleName: 'NoMatch',
					description: `${TRANSFORM_ERRORS.NO_RULE} ${currentLine}`,
					line: lineNumber,
				});
			}
		}

		return { intermediateRepresentation: { root }, detail };
	}

	private splitToLines(source: string): string[] {
		return source.split('\n');
	}

	private pushToCurrentScope(node: IRNode, state: ParserState, root: IRNode): void {
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

	private isPerformLine(line: string): boolean {
		return line.toUpperCase().startsWith('PERFORM');
	}
	private isIfLine(line: string): boolean {
		return line.toUpperCase().startsWith('IF');
	}
	private isDisplayLine(line: string): boolean {
		return line.toUpperCase().startsWith('DISPLAY');
	}
	private isAssignmentLine(line: string): boolean {
		return line.toUpperCase().startsWith('MOVE');
	}
	private isAddLine(line: string): boolean {
		return line.toUpperCase().startsWith('ADD');
	}
	private isCallLine(line: string): boolean {
		return line.toUpperCase().startsWith('CALL');
	}
	private isVarDeclarationLine(line: string): boolean {
		return /^\d{2}\s+\w+/i.test(line);
	}
	private isEndIfLine(line: string): boolean {
		return line.toUpperCase().startsWith('END-IF');
	}
	private isEndPerformLine(line: string): boolean {
		return line.toUpperCase().startsWith('END-PERFORM');
	}
	private isElseLine(line: string): boolean {
		return line.toUpperCase().startsWith('ELSE');
	}
	private isIgnorableLine(line: string): boolean {
		const upper = line.toUpperCase();
		return (
			upper.startsWith('IDENTIFICATION DIVISION') ||
			upper.startsWith('PROGRAM-ID') ||
			upper.startsWith('DATA DIVISION') ||
			upper.startsWith('WORKING-STORAGE SECTION') ||
			upper.startsWith('PROCEDURE DIVISION') ||
			upper.startsWith('STOP RUN')
		);
	}

	private handlePerform(line: string, state: ParserState, root?: IRNode): boolean {
		const loopNode = parsePerform(line);
		if (!loopNode || !root) return false;
		root.children = root.children || [];
		root.children.push(loopNode);
		state.currentLoop = loopNode;
		state.currentIf = null;
		state.currentIfElse = false;
		return true;
	}

	private handleIf(line: string, state: ParserState, root?: IRNode): boolean {
		const ifNode = parseIf(line);
		if (!ifNode) return false;
		if (state.currentLoop) {
			state.currentLoop.children = state.currentLoop.children || [];
			state.currentLoop.children.push(ifNode);
			state.currentIf = ifNode;
			state.currentIfElse = false;
			return true;
		}
		if (root) {
			root.children = root.children || [];
			root.children.push(ifNode);
			state.currentIf = ifNode;
			state.currentIfElse = false;
			return true;
		}
		return false;
	}

	private handleAdd(line: string, state: ParserState, root?: IRNode): boolean {
		const node = parseAdd(line);
		if (!node || !root) return false;
		this.pushToCurrentScope(node, state, root);
		return true;
	}

	private handleDisplay(line: string, state: ParserState, root?: IRNode): boolean {
		const displayNode = parseDisplay(line);
		if (!displayNode || !root) return false;
		this.pushToCurrentScope(displayNode, state, root);
		return true;
	}

	private handleAssignment(line: string, state: ParserState, root?: IRNode): boolean {
		const node = parseAssignment(line);
		if (!node || !root) return false;
		this.pushToCurrentScope(node, state, root);
		return true;
	}

	private handleCall(line: string, state: ParserState, root?: IRNode): boolean {
		const node = parseCall(line);
		if (!node || !root) return false;
		this.pushToCurrentScope(node, state, root);
		return true;
	}

	private handleVarDeclaration(line: string, _state: ParserState, root?: IRNode): boolean {
		const node = parseVarDeclaration(line);
		if (!node || !root) return false;
		root.children = root.children || [];
		root.children.push(node);
		return true;
	}

	private handleElse(_line: string, state: ParserState): boolean {
		if (!state.currentIf) return false;
		(state.currentIf as any).elseChildren = (state.currentIf as any).elseChildren || [];
		state.currentIfElse = true;
		return true;
	}

	private get rules(): Rule[] {
		return [
			{
				name: TRANSFORM_RULES.COBOL.PERFORM,
				description: DESCRIPTION_RULES.COBOL.Perform,
				predicate: (l) => this.isPerformLine(l),
				handler: (l, s, r) => this.handlePerform(l, s, r),
			},
			{
				name: TRANSFORM_RULES.COBOL.IF,
				description: DESCRIPTION_RULES.COBOL.If,
				predicate: (l) => this.isIfLine(l),
				handler: (l, s, r) => this.handleIf(l, s, r),
			},
			{
				name: TRANSFORM_RULES.COBOL.ADD,
				description: DESCRIPTION_RULES.COBOL.ADD,
				predicate: (l) => this.isAddLine(l),
				handler: (l, s, r) => this.handleAdd(l, s, r),
			},
			{
				name: TRANSFORM_RULES.COBOL.ELSE,
				description: DESCRIPTION_RULES.COBOL.Else,
				predicate: (l) => this.isElseLine(l),
				handler: (l, s) => this.handleElse(l, s),
			},
			{
				name: TRANSFORM_RULES.COBOL.VAR_DECLARATION,
				description: DESCRIPTION_RULES.COBOL.VAR_DECLARATION,
				predicate: (l) => this.isVarDeclarationLine(l),
				handler: (l, s, r) => this.handleVarDeclaration(l, s, r),
			},
			{
				name: TRANSFORM_RULES.COBOL.ASSIGNMENT,
				description: DESCRIPTION_RULES.COBOL.ASSIGNMENT,
				predicate: (l) => this.isAssignmentLine(l),
				handler: (l, s, r) => this.handleAssignment(l, s, r),
			},
			{
				name: TRANSFORM_RULES.COBOL.CALL,
				description: DESCRIPTION_RULES.COBOL.CALL,
				predicate: (l) => this.isCallLine(l),
				handler: (l, s, r) => this.handleCall(l, s, r),
			},
			{
				name: TRANSFORM_RULES.COBOL.DISPLAY,
				description: DESCRIPTION_RULES.COBOL.DISPLAY,
				predicate: (l) => this.isDisplayLine(l),
				handler: (l, s, r) => this.handleDisplay(l, s, r),
			},
			{
				name: TRANSFORM_RULES.COBOL.END_IF,
				description: DESCRIPTION_RULES.COBOL.END_IF,
				predicate: (l) => this.isEndIfLine(l),
				handler: (_l, s) => {
					s.currentIf = null;
					s.currentIfElse = false;
					return true;
				},
			},
			{
				name: TRANSFORM_RULES.COBOL.END_PERFORM,
				description: DESCRIPTION_RULES.COBOL.END_PERFORM,
				predicate: (l) => this.isEndPerformLine(l),
				handler: (_l, s) => {
					s.currentLoop = null;
					return true;
				},
			},
		];
	}
}
