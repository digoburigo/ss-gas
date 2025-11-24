-- Update achievements to PT-BR and ensure all triggers are working

-- Update existing achievements to PT-BR
UPDATE achievements SET 
  name = 'Campeão de Vendas',
  description = 'Criou 5 pedidos de venda'
WHERE milestone_type = 'sales' AND milestone_count = 5;

UPDATE achievements SET 
  name = 'Organizador de Eventos',
  description = 'Agendou 5 eventos no calendário'
WHERE milestone_type = 'events' AND milestone_count = 5;

UPDATE achievements SET 
  name = 'Mestre das Tarefas',
  description = 'Completou 5 tarefas no kanban'
WHERE milestone_type = 'kanban_tasks' AND milestone_count = 5;

UPDATE achievements SET 
  name = 'Integração Completa',
  description = 'Finalizou os primeiros passos'
WHERE milestone_type = 'onboarding' AND milestone_count = 1;

-- Ensure all triggers exist and are properly configured

-- Drop and recreate trigger for sales_orders
DROP TRIGGER IF EXISTS trigger_track_sales_order ON sales_orders;
CREATE TRIGGER trigger_track_sales_order
  AFTER INSERT ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION track_sales_order_creation();

-- Drop and recreate trigger for calendar_events  
DROP TRIGGER IF EXISTS trigger_track_calendar_event ON calendar_events;
CREATE TRIGGER trigger_track_calendar_event
  AFTER INSERT ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION track_calendar_event_creation();

-- Drop and recreate trigger for kanban_cards
DROP TRIGGER IF EXISTS trigger_track_kanban_completion ON kanban_cards;
CREATE TRIGGER trigger_track_kanban_completion
  AFTER INSERT OR UPDATE ON kanban_cards
  FOR EACH ROW
  EXECUTE FUNCTION track_kanban_task_completion();

-- Drop and recreate trigger for onboarding_checklist_progress
DROP TRIGGER IF EXISTS trigger_track_onboarding_completion ON onboarding_checklist_progress;
CREATE TRIGGER trigger_track_onboarding_completion
  AFTER INSERT OR UPDATE ON onboarding_checklist_progress
  FOR EACH ROW
  EXECUTE FUNCTION track_onboarding_completion();

-- Add helpful comments
COMMENT ON TRIGGER trigger_track_sales_order ON sales_orders IS 
  'Tracks sales order creation and awards Campeão de Vendas achievement after 5 sales';

COMMENT ON TRIGGER trigger_track_calendar_event ON calendar_events IS 
  'Tracks calendar event creation and awards Organizador de Eventos achievement after 5 events';

COMMENT ON TRIGGER trigger_track_kanban_completion ON kanban_cards IS 
  'Tracks kanban card completion (moved to Finalizado column) and awards Mestre das Tarefas achievement after 5 completions';

COMMENT ON TRIGGER trigger_track_onboarding_completion ON onboarding_checklist_progress IS 
  'Tracks onboarding progress completion and awards Integração Completa achievement when all steps are done';
