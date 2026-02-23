import { IRNode } from '../models/intermediate-representation.model';

const AVAILABLE_OPERATORS = ['<>', '!=', '>=', '<=', '>', '<', '='];

function normalizeRightOperand(rawOperand: string): string | number {
	if (/^\d+$/.test(rawOperand)) return Number(rawOperand);
	if (/^".*"$/.test(rawOperand)) return rawOperand.slice(1, -1);
	return rawOperand;
}

export function parseDisplay(line: string): IRNode | null {
	// Capture quoted text and optional trailing variables/expressions
	const displayMatch = /DISPLAY\s+"([^"]+)"(?:\s+(.+))?/i.exec(line);
	if (!displayMatch) return null;
	const [, text, rest] = displayMatch;
	const args = rest ? rest.split(/\s*,\s*|\s+/).filter(Boolean) : [];
	return {
		type: 'PrintStatement',
		value: { text, args },
	};
}

export function parseAdd(line: string): IRNode | null {
	// Simple ADD x TO y  -> map as Assignment with operator
	const addRegex = /ADD\s+(\w+)\s+TO\s+(\w+)/i;
	const match = addRegex.exec(line);
	if (!match) return null;
	const [, operand, target] = match;
	return {
		type: 'AssignmentStatement',
		value: { target, operator: 'ADD', operands: [operand] },
	};
}

export function parseIf(line: string): IRNode | null {
	const ifRegex = /IF\s+(\w+)\s*(<>|!=|>=|<=|=|>|<)\s*(\d+|\w+|"[^"]+")/;
	const parsedIf = ifRegex.exec(line);
	if (!parsedIf) return null;

	const [, leftOperand, operator, rightRaw] = parsedIf;
	const right = normalizeRightOperand(rightRaw);

	return {
		type: 'IfStatement',
		value: {
			left: leftOperand,
			operator,
			right,
			availableOperators: AVAILABLE_OPERATORS,
		},
		children: [],
	};
}

export function parsePerform(line: string): IRNode | null {
	const performRegex = /PERFORM VARYING (\w+) FROM (\d+) BY (\d+) UNTIL \1 > (\w+)/;
	const performMatch = performRegex.exec(line);
	if (!performMatch) return null;

	const [, iterator, fromRaw, stepRaw, until] = performMatch;
	return {
		type: 'ForLoop',
		value: {
			iterator,
			from: Number(fromRaw),
			step: Number(stepRaw),
			until,
		},
		children: [],
	};
}

export function parseAssignment(line: string): IRNode | null {
	const assignRegex = /MOVE\s+("[^"]+"|\w+)\s+TO\s+(\w+)/i;
	const match = assignRegex.exec(line);
	if (!match) return null;
	const [, sourceRaw, target] = match;
	const source = normalizeRightOperand(sourceRaw);
	return {
		type: 'AssignmentStatement',
		value: { target, source },
	};
}

export function parseVarDeclaration(line: string): IRNode | null {
	// Capture optional VALUE after PIC
	const declRegex = /^(\d{2})\s+(\w+)\s+PIC\s+([A-Z0-9()V\-\.,]+)(?:\s+VALUE\s+("[^"]+"|\d+))?/i;
	const match = declRegex.exec(line);
	if (!match) return null;
	const [, level, name, pic, valueRaw] = match;
	const initialValue = valueRaw ? normalizeRightOperand(valueRaw) : undefined;
	return {
		type: 'VarDeclaration',
		value: {
			level: Number(level),
			name,
			pic,
			initialValue,
		},
	};
}

export function parseCall(line: string): IRNode | null {
	const callRegex = /CALL\s+['"]?(\w+)['"]?(?:\s+USING\s+(.+))?/i;
	const match = callRegex.exec(line);
	if (!match) return null;
	const [, proc, argsRaw] = match;
	const args = argsRaw ? argsRaw.split(/\s*,\s*|\s+/).filter(Boolean) : [];
	return {
		type: 'CallExpression',
		value: { proc, args },
	};
}
