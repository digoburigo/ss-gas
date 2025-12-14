import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@acme/ui/base-ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/base-ui/card";
import { Field, FieldLabel, FieldSet } from "@acme/ui/base-ui/field";
import { Input } from "@acme/ui/base-ui/input";
import { FieldError } from "@acme/ui/field";

import { authClient } from "~/clients/auth-client";

const registerSchema = z
  .object({
    name: z.string().min(1, { error: "Nome é obrigatório" }),
    email: z.email({ error: "Email inválido" }),
    password: z
      .string()
      .min(8, { error: "Senha deve ter pelo menos 8 caracteres" }),
    confirmPassword: z
      .string()
      .min(8, { error: "Senha deve ter pelo menos 8 caracteres" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem",
  });

export const Route = createFileRoute("/auth/register")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate({
    from: "/",
  });

  const form = useForm({
    defaultValues: {
      name: "a",
      email: "a@a.com",
      password: "123123123",
      confirmPassword: "123123123",
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        {
          name: value.name,
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            navigate({
              to: "/",
            });
            toast.success("Cadastro realizado com sucesso");
          },
          onError: (error) => {
            toast.error("Erro ao fazer cadastro", {
              description: error.error.message || error.error.statusText,
            });
          },
        },
      );
    },
    validators: {
      onSubmit: registerSchema,
    },
  });

  return (
    <div className="flex items-center justify-center">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Cadastro</CardTitle>
            <CardDescription>Cadastre-se para continuar</CardDescription>
          </CardHeader>
          <form
            id="register-form"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <CardContent>
              <FieldSet className="flex flex-col gap-4">
                <form.Field
                  children={(field) => (
                    <Field>
                      <FieldLabel>Nome</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Nome"
                        type="text"
                        value={field.state.value}
                      />

                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                  name="name"
                />
                <form.Field
                  children={(field) => (
                    <Field>
                      <FieldLabel>Email</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Email"
                        type="email"
                        value={field.state.value}
                      />

                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                  name="email"
                />

                <form.Field
                  children={(field) => (
                    <Field>
                      <FieldLabel>Senha</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Senha"
                        type="password"
                        value={field.state.value}
                      />

                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                  name="password"
                />
                <form.Field
                  children={(field) => (
                    <Field>
                      <FieldLabel>Confirmar Senha</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Confirmar Senha"
                        type="password"
                        value={field.state.value}
                      />

                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                  name="confirmPassword"
                />
              </FieldSet>
            </CardContent>
            <CardFooter>
              <form.Subscribe
                children={({ isSubmitting }) => (
                  <Button
                    className="mt-8 w-full"
                    disabled={isSubmitting}
                    size="lg"
                    type="submit"
                  >
                    {isSubmitting ? "Cadastrando..." : "Cadastrar"}
                  </Button>
                )}
              />
            </CardFooter>
          </form>
        </Card>
        <div className="text-muted-foreground text-center text-xs text-balance">
          Ao continuar, você concorda com nossos{" "}
          <Button
            className="text-muted-foreground p-0"
            render={<Link to="/">Termos de Serviço</Link>}
            size="xs"
            type="button"
            variant="link"
          />{" "}
          e{" "}
          <Button
            className="text-muted-foreground p-0"
            render={<Link to="/">Políticas de Privacidade</Link>}
            size="xs"
            type="button"
            variant="link"
          />
          .
        </div>
      </div>
    </div>
  );
}
