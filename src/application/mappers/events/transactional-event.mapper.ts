export class TransactionalEventMapper {
	public static map = <T>(
		payload: T,
		eventIndex: string
	): { messageType: string; messageContent: string } => {
		const buffer = Buffer.from(JSON.stringify(payload));
		return {
			messageType: eventIndex,
			messageContent: buffer.toString('base64'),
		};
	};
}
