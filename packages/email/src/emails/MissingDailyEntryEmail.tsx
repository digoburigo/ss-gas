import { Html, Text, Container, Heading, Hr } from "@react-email/components";
import { EmailButton } from "../components/email-button";
import TailwindProvider from "../utils/tailwind";

export default function MissingDailyEntryEmail({
	userName,
	unitName,
	date,
	entryFormLink,
}: {
	userName: string;
	unitName: string;
	date: string;
	entryFormLink: string;
}) {
	return (
		<TailwindProvider>
			<Html>
				<Container className="mx-auto max-w-xl p-4">
					<Heading className="text-xl font-bold text-gray-800">
						Lançamento Diário Pendente
					</Heading>
					<Hr className="my-4 border-gray-200" />
					<Text className="text-gray-700">Olá {userName},</Text>
					<Text className="text-gray-700">
						O lançamento diário de consumo de gás da unidade{" "}
						<strong>{unitName}</strong> para o dia <strong>{date}</strong> ainda
						não foi registrado.
					</Text>
					<Text className="text-gray-700">
						Por favor, realize o lançamento o mais breve possível para manter os
						relatórios de consumo atualizados.
					</Text>
					<div className="my-6">
						<EmailButton href={entryFormLink}>Realizar Lançamento</EmailButton>
					</div>
					<Hr className="my-4 border-gray-200" />
					<Text className="text-sm text-gray-500">
						Este é um email automático do sistema de gestão de consumo de gás.
						Se você já realizou o lançamento, por favor ignore esta mensagem.
					</Text>
				</Container>
			</Html>
		</TailwindProvider>
	);
}
