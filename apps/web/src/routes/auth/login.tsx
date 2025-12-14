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

const loginSchema = z.object({
  email: z.email({ error: "Email inválido" }),
  password: z
    .string()
    .min(8, { error: "Senha deve ter pelo menos 8 caracteres" }),
});

export const Route = createFileRoute("/auth/login")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate({
    from: "/",
  });

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            navigate({
              to: "/",
            });
            toast.success("Login realizado com sucesso");
          },
          onError: (error) => {
            toast.error("Erro ao fazer login", {
              description: error.error.message || error.error.statusText,
            });
          },
        },
      );
    },
    validators: {
      onSubmit: loginSchema,
    },
  });

  return (
    <div className="flex items-center justify-center">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Bem-vindo</CardTitle>
            <CardDescription>Acesse sua conta para continuar</CardDescription>
          </CardHeader>
          <form
            id="login-form"
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
                    {isSubmitting ? "Entrando..." : "Entrar"}
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
