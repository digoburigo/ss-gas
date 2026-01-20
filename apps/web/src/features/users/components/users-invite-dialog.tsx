import { zodResolver } from "@hookform/resolvers/zod";
import { MailPlus, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { Input } from "@acme/ui/input";
import { Textarea } from "@acme/ui/textarea";

import { SelectDropdown } from "~/components/select-dropdown";
import { authClient } from "~/clients/auth-client";
import { profiles, roles } from "../data/data";

const formSchema = z.object({
  email: z.string().email({
    message: "Por favor, insira um email válido.",
  }),
  role: z.enum(["owner", "admin", "member"] as const, {
    message: "Cargo é obrigatório.",
  }),
  profile: z.enum(["admin", "manager", "operator", "viewer"] as const, {
    message: "Perfil é obrigatório.",
  }),
  desc: z.string().optional(),
});

type UserInviteForm = z.infer<typeof formSchema>;

type UserInviteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UsersInviteDialog({
  open,
  onOpenChange,
}: UserInviteDialogProps) {
  const form = useForm<UserInviteForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", role: "member", profile: "viewer", desc: "" },
  });

  const onSubmit = async (values: UserInviteForm) => {
    try {
      await authClient.organization.inviteMember({
        email: values.email,
        role: values.role,
      });

      toast.success("Convite enviado", {
        description: `Um convite foi enviado para ${values.email}.`,
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao enviar convite", {
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao enviar o convite.",
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset();
        onOpenChange(state);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-start">
          <DialogTitle className="flex items-center gap-2">
            <MailPlus /> Convidar Usuário
          </DialogTitle>
          <DialogDescription>
            Convide um novo usuário para a sua organização enviando um email.
            Defina o cargo e o perfil de acesso.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="user-invite-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="ex: joao.silva@empresa.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo na Organização</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder="Selecione um cargo"
                    items={roles.map(({ label, value }) => ({
                      label,
                      value,
                    }))}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="profile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Perfil de Acesso</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder="Selecione um perfil"
                    items={profiles.map(({ label, value, description }) => ({
                      label: `${label} - ${description}`,
                      value,
                    }))}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="desc"
              render={({ field }) => (
                <FormItem className="">
                  <FormLabel>Mensagem (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      className="resize-none"
                      placeholder="Adicione uma mensagem personalizada ao convite"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter className="gap-y-2">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            type="submit"
            form="user-invite-form"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Enviando..." : "Convidar"}
            <Send />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
