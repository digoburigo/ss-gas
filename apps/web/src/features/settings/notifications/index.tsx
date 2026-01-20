import { ContentSection } from "../components/content-section";
import { NotificationsForm } from "./notifications-form";

export function SettingsNotifications() {
  return (
    <ContentSection
      title="Notificações"
      desc="Configure suas preferências de notificação para alertas de lançamento de gás."
    >
      <NotificationsForm />
    </ContentSection>
  );
}
