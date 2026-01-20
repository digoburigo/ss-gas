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

interface DeviationAlertEmailProps {
  recipientName?: string;
  unitName: string;
  unitCode: string;
  contractName?: string;
  date: string;
  scheduledVolume: number;
  actualVolume: number;
  deviationPercent: number;
  thresholdPercent: number;
  dashboardLink: string;
}

export default function DeviationAlertEmail({
  recipientName,
  unitName,
  unitCode,
  contractName,
  date,
  scheduledVolume,
  actualVolume,
  deviationPercent,
  thresholdPercent,
  dashboardLink,
}: DeviationAlertEmailProps) {
  const greeting = recipientName ? `Olá ${recipientName},` : "Olá,";
  const isOverConsumption = deviationPercent > 0;
  const deviationType = isOverConsumption ? "acima" : "abaixo";
  const absDeviation = Math.abs(deviationPercent);

  return (
    <TailwindProvider>
      <Html>
        <Container className="mx-auto max-w-xl p-4">
          <Heading className="text-xl font-bold text-gray-800">
            ⚠️ Alerta de Desvio de Programação
          </Heading>
          <Hr className="my-4 border-gray-200" />

          <Text className="text-gray-700">{greeting}</Text>

          <Text className="text-gray-700">
            Foi detectado um desvio significativo entre o consumo programado e o
            consumo real na unidade <strong>{unitName}</strong>.
          </Text>

          <Section className="my-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <Text className="m-0 font-semibold text-red-800">
              🚨 Desvio Detectado
            </Text>
            <Hr className="my-2 border-red-200" />

            <Text className="m-0 text-sm text-red-700">
              O consumo real ficou{" "}
              <strong>
                {absDeviation.toFixed(1)}% {deviationType}
              </strong>{" "}
              do programado, excedendo o limite configurado de ±
              {thresholdPercent}%.
            </Text>
          </Section>

          <Section className="my-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <Text className="m-0 font-semibold text-gray-800">
              📋 Detalhes do Desvio
            </Text>
            <Hr className="my-2 border-gray-200" />

            <Text className="m-0 text-sm text-gray-700">
              <strong>Unidade:</strong> {unitName} ({unitCode})
            </Text>

            {contractName && (
              <Text className="m-0 text-sm text-gray-700">
                <strong>Contrato:</strong> {contractName}
              </Text>
            )}

            <Text className="m-0 text-sm text-gray-700">
              <strong>Data:</strong> {date}
            </Text>

            <Text className="m-0 text-sm text-gray-700">
              <strong>Volume Programado (QDP):</strong>{" "}
              {scheduledVolume.toLocaleString("pt-BR")} m³
            </Text>

            <Text className="m-0 text-sm text-gray-700">
              <strong>Volume Real (QDR):</strong>{" "}
              {actualVolume.toLocaleString("pt-BR")} m³
            </Text>

            <Text className="m-0 text-sm text-gray-700">
              <strong>Desvio:</strong>{" "}
              <span
                className={isOverConsumption ? "text-red-600" : "text-blue-600"}
              >
                {deviationPercent > 0 ? "+" : ""}
                {deviationPercent.toFixed(1)}%
              </span>
            </Text>

            <Text className="m-0 text-sm text-gray-700">
              <strong>Limite Configurado:</strong> ±{thresholdPercent}%
            </Text>
          </Section>

          <Section className="my-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <Text className="m-0 font-semibold text-amber-800">
              📝 Próximos Passos
            </Text>
            <Text className="m-0 mt-2 text-sm text-amber-700">
              Acesse o painel de alertas de desvio para visualizar todos os
              detalhes e registrar a causa do desvio para análise futura.
            </Text>
          </Section>

          <div className="my-6">
            <EmailButton href={dashboardLink}>Ver Painel de Alertas</EmailButton>
          </div>

          <Hr className="my-4 border-gray-200" />

          <Text className="text-sm text-gray-500">
            Este é um email automático do sistema SS-GAS. O alerta foi gerado
            porque o desvio de {absDeviation.toFixed(1)}% excede o limite
            configurado de ±{thresholdPercent}%. Para ajustar o limiar de
            alerta, acesse o painel de Parâmetros Administrativos.
          </Text>
        </Container>
      </Html>
    </TailwindProvider>
  );
}
