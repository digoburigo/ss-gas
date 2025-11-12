import "~/styles.css";

import type { TextInput } from "react-native";
import * as React from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/accordion";
// import { SocialConnections } from '@/components/social-connections';
import { Button } from "~/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/card";
import { Input } from "~/components/input";
import { Label } from "~/components/label";
import { Separator } from "~/components/separator";
import { Text } from "~/components/text";

export function AccordionPreview() {
  return (
    <Accordion
      type="single"
      collapsible
      className="w-full max-w-lg"
      defaultValue="item-1"
    >
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <Text>Product Information</Text>
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <Text>
            Our flagship product combines cutting-edge technology with sleek
            design. Built with premium materials, it offers unparalleled
            performance and reliability.
          </Text>
          <Text>
            Key features include advanced processing capabilities, and an
            intuitive user interface designed for both beginners and experts.
          </Text>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>
          <Text>Shipping Details</Text>
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <Text>
            We offer worldwide shipping through trusted courier partners.
            Standard delivery takes 3-5 business days, while express shipping
            ensures delivery within 1-2 business days.
          </Text>
          <Text>
            All orders are carefully packaged and fully insured. Track your
            shipment in real-time through our dedicated tracking portal.
          </Text>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>
          <Text>Return Policy</Text>
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <Text>
            We stand behind our products with a comprehensive 30-day return
            policy. If you&apos;re not completely satisfied, simply return the
            item in its original condition.
          </Text>
          <Text>
            Our hassle-free return process includes free return shipping and
            full refunds processed within 48 hours of receiving the returned
            item.
          </Text>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export default function Login() {
  const passwordInputRef = React.useRef<TextInput>(null);

  function onEmailSubmitEditing() {
    passwordInputRef.current?.focus();
  }

  function onSubmit() {
    // TODO: Submit form and navigate to protected screen if successful
  }

  return (
    <SafeAreaView>
      <Stack.Screen options={{ title: "Login" }} />

      <View className="p-6">
        <AccordionPreview />

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-xl sm:text-left">
              Sign in to your app
            </CardTitle>
            <CardDescription className="text-center sm:text-left">
              Welcome back! Please sign in to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-6">
            <View className="gap-6">
              <View className="gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="m@example.com"
                  keyboardType="email-address"
                  autoComplete="email"
                  autoCapitalize="none"
                  onSubmitEditing={onEmailSubmitEditing}
                  returnKeyType="next"
                  submitBehavior="submit"
                />
              </View>
              <View className="gap-1.5">
                <View className="flex-row items-center">
                  <Label htmlFor="password">Password</Label>
                  <Button
                    variant="link"
                    size="sm"
                    className="web:h-fit ml-auto h-4 px-1 py-0 sm:h-4"
                    onPress={() => {
                      // TODO: Navigate to forgot password screen
                    }}
                  >
                    <Text className="leading-4 font-normal">
                      Forgot your password?
                    </Text>
                  </Button>
                </View>
                <Input
                  ref={passwordInputRef}
                  id="password"
                  secureTextEntry
                  returnKeyType="send"
                  onSubmitEditing={onSubmit}
                />
              </View>
              <Button className="w-full" onPress={onSubmit}>
                <Text>Continue</Text>
              </Button>
            </View>
            <View className="flex-row items-center">
              <Text className="text-center text-sm">
                Don&apos;t have an account?{" "}
              </Text>
              <Pressable
                onPress={() => {
                  // TODO: Navigate to sign up screen
                }}
              >
                <Text className="text-sm underline">Sign up</Text>
              </Pressable>
            </View>
            <View className="flex-row items-center">
              <Separator className="flex-1" />
              <Text className="text-muted-foreground px-4 text-sm">or</Text>
              <Separator className="flex-1" />
            </View>
            {/* <SocialConnections /> */}
          </CardContent>
        </Card>
      </View>
    </SafeAreaView>
  );
}
