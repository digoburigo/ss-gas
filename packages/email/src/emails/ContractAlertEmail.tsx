import {
  Html,
  Text,
  Container,
  Heading,
  Hr,
  Section,
} from "@react-email/components";
import { EmailButton } from "../components/email-button";
import TailwindProvider from "../utils/tailwind";

interface ContractAlertEmailProps {
  recipientName?: string;
  contractName: string;
  unitName?: string;
  eventName: string;
  eventDescription?: string;
  eventDate: string;
  advanceNoticeDays: number;
  requiredAction: string;
  contractLink: string;
}

export default function ContractAlertEmail({
  recipientName,
  contractName,
  unitName,
  eventName,
  eventDescription,
  eventDate,
  advanceNoticeDays,
  requiredAction,
  contractLink,
}: ContractAlertEmailProps) {
  const greeting = recipientName ? `Olá ${recipientName},` : "Olá,";

  const advanceText =
    advanceNoticeDays === 0
      ? "HOJE"
      : advanceNoticeDays === 1
        ? "AMANHÃ"
        : `em ${advanceNoticeDays} dias`;

  return (
    <TailwindProvider>
      <Html>
        <Container className="mx-auto max-w-xl p-4">
          <Heading className="text-xl font-bold text-gray-800">
            🔔 Alerta de Contrato: {eventName}
          </Heading>
          <Hr className="my-4 border-gray-200" />

          <Text className="text-gray-700">{greeting}</Text>

          <Text className="text-gray-700">
            Este é um lembrete automático sobre um evento importante relacionado
            ao contrato de gás <strong>{contractName}</strong>.
          </Text>

          <Section className="my-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <Text className="m-0 font-semibold text-gray-800">
              📋 Detalhes do Evento
            </Text>
            <Hr className="my-2 border-gray-200" />

            <Text className="m-0 text-sm text-gray-700">
              <strong>Evento:</strong> {eventName}
            </Text>

            {eventDescription && (
              <Text className="m-0 text-sm text-gray-600">
                {eventDescription}
              </Text>
            )}

            <Text className="m-0 text-sm text-gray-700">
              <strong>Data do Evento:</strong> {eventDate}
            </Text>

            <Text className="m-0 text-sm text-gray-700">
              <strong>Prazo:</strong>{" "}
              <span
                className={
                  advanceNoticeDays <= 1 ? "font-bold text-red-600" : ""
                }
              >
                {advanceText}
              </span>
            </Text>

            <Text className="m-0 text-sm text-gray-700">
              <strong>Contrato:</strong> {contractName}
            </Text>

            {unitName && (
              <Text className="m-0 text-sm text-gray-700">
                <strong>Unidade:</strong> {unitName}
              </Text>
            )}
          </Section>

          <Section className="my-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <Text className="m-0 font-semibold text-amber-800">
              ⚠️ Ação Necessária
            </Text>
            <Text className="m-0 mt-2 text-sm text-amber-700">
              {requiredAction}
            </Text>
          </Section>

          <div className="my-6">
            <EmailButton href={contractLink}>Ver Contrato</EmailButton>
          </div>

          <Hr className="my-4 border-gray-200" />

          <Text className="text-sm text-gray-500">
            Este é um email automático do sistema SS-GAS de gestão de contratos
            de gás natural. Para gerenciar suas configurações de alertas, acesse
            o sistema e navegue até a seção de alertas do contrato.
          </Text>
        </Container>
      </Html>
    </TailwindProvider>
  );
}
