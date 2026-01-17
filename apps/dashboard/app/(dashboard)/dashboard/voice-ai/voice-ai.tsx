'use client'

export function VoiceAI() {
	// const [assistantId, setAssistantId] = useState();
	// const publicVapiKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

	// if (!publicVapiKey) {
	//   throw new Error('NEXT_PUBLIC_VAPI_PUBLIC_KEY is not defined.');
	// }

	// const vapi = new Vapi(publicVapiKey);

	// // eslint-disable-next-line @typescript-eslint/no-unused-vars
	// async function startAssistance() {
	//   await vapi.start(assistantId);
	// }

	// // eslint-disable-next-line @typescript-eslint/no-unused-vars
	// async function stopAssistance() {
	//   await vapi.stop();
	// }

	// useEffect(() => {
	//   create().then((data) => setAssistantId(data.id));
	// }, []);

	return (
		<section className="flex-1">
			<h1 className="text-lg lg:text-2xl font-extrabold mb-6">Voice AI</h1>
		</section>
	)
}
