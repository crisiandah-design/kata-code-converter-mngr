import { ITargetLanguageMapper } from 'domain/interfaces/i-target-language-mapper.interface';
import {
	IntermediateRepresentation,
	IRNode,
} from '../../../../domain/models/intermediate-representation.model';

class JavaMapper implements ITargetLanguageMapper {
	private readonly generators: Record<
		string,
		(node: IRNode, lines: string[], level: number, loopIterators: Set<string>) => void
	>;
	private readonly RE_TRAILING_SEMICOLON = /;$/;
	private readonly RE_SURROUNDING_QUOTES = /^['"]|['"]$/g;
	private readonly RE_NON_ALPHANUM = /[^a-zA-Z0-9]+/g;
	private readonly RE_NUMERIC = /^-?\d+(?:\.\d+)?$/;
	private readonly RE_EXPRESSION_OPERATORS = /[+\-*/()]/;
	private readonly RE_SPLIT_EXPRESSION_TOKENS = /(\+|-|\*|\/|\(|\))/;

	constructor() {
		this.generators = {
			Program: (node, lines, level, iterators) =>
				this.generateProgram(node, lines, level, iterators),
			ForLoop: (node, lines, level, iterators) =>
				this.generateForLoop(node, lines, level, iterators),
			VarDeclaration: (node, lines, level, iterators) =>
				this.generateVarDeclaration(node, lines, level, iterators),
			AssignmentStatement: (node, lines, level, iterators) =>
				this.generateAssignment(node, lines, level, iterators),
			IfStatement: (node, lines, level, iterators) =>
				this.generateIfStatement(node, lines, level, iterators),
			PrintStatement: (node, lines, level, iterators) =>
				this.generatePrintStatement(node, lines, level, iterators),
		};
	}

	public generate(input: IntermediateRepresentation): string {
		const lines: string[] = [];
		if (!input || !input.root) return '';
		const loopIterators = new Set<string>();
		this.generateNode(input.root, lines, 0, loopIterators);
		return lines.join('\n');
	}

	private generateNode(
		node: IRNode,
		lines: string[],
		level: number,
		loopIterators: Set<string>
	): void {
		const generator = this.generators[node.type];
		if (!generator) {
			this.generateUnsupported(node, lines, level);
			return;
		}
		generator(node, lines, level, loopIterators);
	}

	private generateProgram(
		node: IRNode,
		lines: string[],
		level: number,
		loopIterators: Set<string>
	): void {
		(node.children || []).forEach((child) => this.generateNode(child, lines, level, loopIterators));
	}

	private generateForLoop(
		node: IRNode,
		lines: string[],
		level: number,
		loopIterators: Set<string>
	): void {
		const iteratorRaw = node.value?.iterator ?? 'i';
		const iterator = this.normalizeIdentifier(iteratorRaw);
		const from = node.value?.from ?? 0;
		const step = node.value?.step ?? 1;
		const untilRaw = node.value?.until ?? 'LIMIT';
		const until = typeof untilRaw === 'number' ? untilRaw : this.normalizeIdentifier(untilRaw);

		lines.push(
			`${this.indent(
				level
			)}for (int ${iterator} = ${from}; ${iterator} <= ${until}; ${iterator} += ${step}) {`
		);
		loopIterators.add(iterator);
		(node.children || []).forEach((child) =>
			this.generateNode(child, lines, level + 1, loopIterators)
		);
		loopIterators.delete(iterator);
		lines.push(`${this.indent(level)}}`);
	}

	private generateIfStatement(
		node: IRNode,
		lines: string[],
		level: number,
		loopIterators: Set<string>
	): void {
		const leftRaw = node.value?.left ?? 'condLeft';
		const left = this.normalizeIdentifier(leftRaw);
		const operator = node.value?.operator ?? '>';
		const right = this.formatRightOperand(node.value?.right);

		lines.push(`${this.indent(level)}if (${left} ${operator} ${right}) {`);
		(node.children || []).forEach((child) =>
			this.generateNode(child, lines, level + 1, loopIterators)
		);
		if ((node as any).elseChildren && (node as any).elseChildren.length) {
			lines.push(`${this.indent(level)}} else {`);
			(node as any).elseChildren.forEach((elseChild: IRNode) =>
				this.generateNode(elseChild, lines, level + 1, loopIterators)
			);
		}
		lines.push(`${this.indent(level)}}`);
	}

	private generatePrintStatement(
		node: IRNode,
		lines: string[],
		level: number,
		_loopIterators: Set<string>
	): void {
		const value = node.value ?? '';
		if (typeof value === 'string') {
			lines.push(`${this.indent(level)}System.out.println(${JSON.stringify(value)});`);
			return;
		}
		const text = value.text ?? '';
		const args = Array.isArray(value.args)
			? value.args.map((arg: string) => this.normalizeOperand(arg))
			: [];
		const segments = [JSON.stringify(text), ...args];
		const joined = segments.join(' + " " + ');
		lines.push(`${this.indent(level)}System.out.println(${joined});`);
	}

	private generateVarDeclaration(
		node: IRNode,
		lines: string[],
		level: number,
		loopIterators: Set<string>
	): void {
		const rawName = node.value?.name ?? 'var';
		const name = this.normalizeIdentifier(rawName);
		if (loopIterators.has(name)) return;
		const init = node.value?.initialValue;
		if (init !== undefined) {
			const initExpr = typeof init === 'number' ? String(init) : JSON.stringify(init);
			lines.push(`${this.indent(level)}var ${name} = ${initExpr};`);
		} else {
			lines.push(`${this.indent(level)}var ${name} = null;`);
		}
	}

	private generateAssignment(
		node: IRNode,
		lines: string[],
		level: number,
		_loopIterators: Set<string>
	): void {
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
		if (raw === undefined || raw === null) return 'null';
		if (typeof raw === 'number') return String(raw);
		return this.normalizeOperand(raw);
	}

	private indent(level: number): string {
		return '  '.repeat(level);
	}

	private normalizeOperand(raw: any): string {
		if (raw === undefined || raw === null) return 'null';
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
		const camel =
			parts[0] +
			parts
				.slice(1)
				.map((segment: string) => segment.charAt(0).toUpperCase() + segment.slice(1))
				.join('');
		const safe = /^[a-zA-Z_$]/.test(camel.charAt(0)) ? camel : `_${camel}`;
		return safe;
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

export const javaMapper = new JavaMapper();
