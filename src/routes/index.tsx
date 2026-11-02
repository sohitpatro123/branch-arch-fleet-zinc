import { createFileRoute } from "@tanstack/react-router";
import { Mission } from "@/components/Mission";

export const Route = createFileRoute("/")({ component: Mission });
