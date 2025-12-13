import { Tailwind } from "@react-email/components";

export default function TailwindProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<Tailwind
			config={{
				theme: {
					extend: {
						colors: {
							primary: "hsl(142.1 76.2% 36.3%)",
						},
					},
				},
			}}
		>
			{children}
		</Tailwind>
	);
}
