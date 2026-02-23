import { ITargetLanguageMapper } from 'domain/interfaces/i-target-language-mapper.interface';
import {
	IntermediateRepresentation,
	IRNode,
} from '../../../../domain/models/intermediate-representation.model';

class NodeMapper implements ITargetLanguageMapper {
	private readonly generators: Record<
		string,
		(node: IRNode, lines: string[], level: number) => void
	>;
	private readonly RE_TRAILING_SEMICOLON = /;$/;
	private readonly RE_SURROUNDING_QUOTES = /^['"]|['"]$/g;
	private readonly RE_NON_ALPHANUM = /[^a-zA-Z0-9]+/;
	private readonly RE_NUMERIC = /^-?\d+(?:\.\d+)?$/;
	private readonly RE_EXPRESSION_OPERATORS = /[+\-*/()]/;
	private readonly RE_SPLIT_EXPRESSION_TOKENS = /(\+|-|\*|\/|\(|\))/;

	constructor() {
		this.generators = {
			Program: (node, lines, level) => this.generateProgram(node, lines, level),
			ForLoop: (node, lines, level) => this.generateForLoop(node, lines, level),
			VarDeclaration: (node, lines, level) => this.generateVarDeclaration(node, lines, level),
			AssignmentStatement: (node, lines, level) => this.generateAssignment(node, lines, level),
			IfStatement: (node, lines, level) => this.generateIfStatement(node, lines, level),
			PrintStatement: (node, lines, level) => this.generatePrintStatement(node, lines, level),
		};
	}

	public generate(input: IntermediateRepresentation): string {
		const lines: string[] = [];
		if (!input || !input.root) return '';
		this.generateNode(input.root, lines, 0);
		return lines.join('\n');
	}

	private generateNode(node: IRNode, lines: string[], level: number): void {
		const generator = this.generators[node.type];
		if (!generator) {
			this.generateUnsupported(node, lines, level);
			return;
		}
		generator(node, lines, level);
	}

	private generateProgram(node: IRNode, lines: string[], level: number): void {
		(node.children || []).forEach((childNode) => this.generateNode(childNode, lines, level));
	}

	private generateForLoop(node: IRNode, lines: string[], level: number): void {
		const iteratorRaw = node.value?.iterator ?? 'i';
		const iterator = this.normalizeIdentifier(iteratorRaw);
		const from = node.value?.from ?? 0;
		const step = node.value?.step ?? 1;
		const untilRaw = node.value?.until ?? 'LIMIT';
		const until = typeof untilRaw === 'number' ? untilRaw : this.normalizeIdentifier(untilRaw);

		lines.push(
			`${this.indent(
				level
			)}for (let ${iterator} = ${from}; ${iterator} <= ${until}; ${iterator} += ${step}) {`
		);
		(node.children || []).forEach((childNode) => this.generateNode(childNode, lines, level + 1));
		lines.push(`${this.indent(level)}}`);
	}

	private generateIfStatement(node: IRNode, lines: string[], level: number): void {
		const leftRaw = node.value?.left ?? 'condLeft';
		const left = this.normalizeIdentifier(leftRaw);
		const operator = node.value?.operator ?? '>';
		const right = this.formatRightOperand(node.value?.right);

		lines.push(`${this.indent(level)}if (${left} ${operator} ${right}) {`);
		(node.children || []).forEach((childNode) => this.generateNode(childNode, lines, level + 1));
		if ((node as any).elseChildren && (node as any).elseChildren.length) {
			lines.push(`${this.indent(level)}} else {`);
			(node as any).elseChildren.forEach((elseChild: IRNode) =>
				this.generateNode(elseChild, lines, level + 1)
			);
		}
		lines.push(`${this.indent(level)}}`);
	}

	private generatePrintStatement(node: IRNode, lines: string[], level: number): void {
		const value = node.value ?? '';
		if (typeof value === 'string') {
			lines.push(`${this.indent(level)}console.log(${JSON.stringify(value)});`);
			return;
		}
		const text = value.text ?? '';
		const args = Array.isArray(value.args)
			? value.args.map((arg: string) => this.normalizeOperand(arg))
			: [];
		const argsExpr = args.length ? ', ' + args.join(', ') : '';
		lines.push(`${this.indent(level)}console.log(${JSON.stringify(text)}${argsExpr});`);
	}

	private generateVarDeclaration(node: IRNode, lines: string[], level: number): void {
		const rawName = node.value?.name ?? 'var';
		const name = this.normalizeIdentifier(rawName);
		const init = node.value?.initialValue;
		if (init !== undefined) {
			const initExpr = typeof init === 'number' ? String(init) : JSON.stringify(init);
			lines.push(`${this.indent(level)}let ${name} = ${initExpr};`);
		} else {
			lines.push(`${this.indent(level)}let ${name};`);
		}
	}

	private generateAssignment(node: IRNode, lines: string[], level: number): void {
		const targetRaw = node.value?.target ?? 'tmp';
		const target = this.normalizeIdentifier(targetRaw);
		const operator = node.value?.operator;
		if (operator === 'ADD' && Array.isArray(node.value?.operands) && node.value.operands.length) {
			const ops = node.value.operands.map((operand: any) => this.normalizeOperand(operand));
			const expr = ops.join(' + ');
			lines.push(`${this.indent(level)}${target} += ${expr};`);
			return;
		}
		const source = node.value?.source;
		if (source === undefined) {
			lines.push(`${this.indent(level)}// Assignment with no source for ${target}`);
			return;
		}
		const srcExpr = typeof source === 'number' ? String(source) : this.normalizeOperand(source);
		lines.push(`${this.indent(level)}${target} = ${srcExpr};`);
	}

	private generateUnsupported(node: IRNode, lines: string[], level: number): void {
		lines.push(`${this.indent(level)}// Unsupported node type: ${node.type}`);
	}

	private formatRightOperand(raw: any): string {
		if (raw === undefined || raw === null) return 'undefined';
		if (typeof raw === 'number') return String(raw);
		return this.normalizeOperand(raw);
	}

	private indent(level: number): string {
		return '  '.repeat(level);
	}

	private normalizeOperand(raw: any): string {
		if (raw === undefined || raw === null) return 'undefined';
		if (typeof raw === 'number') return String(raw);
		if (typeof raw !== 'string') raw = String(raw);
		const cleaned = this.cleanRawToken(raw);
		if (this.isNumericString(cleaned)) return cleaned;
		if (this.RE_EXPRESSION_OPERATORS.test(cleaned)) return this.formatExpression(cleaned);
		return this.normalizeIdentifier(cleaned);
	}

	private normalizeIdentifier(raw: any): string {
		if (raw === undefined || raw === null) return 'undefined';
		if (typeof raw === 'number') return String(raw);
		if (typeof raw !== 'string') raw = String(raw);
		raw = this.cleanRawToken(raw);
		const parts = raw
			.split(this.RE_NON_ALPHANUM)
			.filter(Boolean)
			.map((part: string) => part.toLowerCase());
		if (!parts.length) return 'tmp';
		const id =
			parts[0] +
			parts
				.slice(1)
				.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
				.join('');
		if (!/^[a-zA-Z_$]/.test(id.charAt(0))) return '_' + id;
		return id;
	}

	private cleanRawToken(raw: string): string {
		return raw
			.replace(this.RE_TRAILING_SEMICOLON, '')
			.trim()
			.replace(this.RE_SURROUNDING_QUOTES, '');
	}

	private isNumericString(value: string): boolean {
		return this.RE_NUMERIC.test(value);
	}

	private formatExpression(raw: string): string {
		const tokens = raw.split(this.RE_SPLIT_EXPRESSION_TOKENS).filter((token) => token !== '');
		const normalized = tokens
			.map((token) => {
				const trimmed = token.trim();
				if (!trimmed) return '';
				if (['+', '-', '*', '/', '(', ')'].includes(trimmed)) return trimmed;
				if (this.isNumericString(trimmed)) return trimmed;
				return this.normalizeIdentifier(trimmed);
			})
			.filter(Boolean);
		const withSpaces = normalized.join(' ');
		return withSpaces.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
	}
}

export const nodeMapper = new NodeMapper();
