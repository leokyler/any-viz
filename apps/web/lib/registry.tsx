"use client";

import { defineRegistry } from "@json-render/react";
import { shadcnComponents } from "@json-render/shadcn";
import { catalog } from "./catalog";
import { LineChart } from "./components/LineChart";
import { BarChart } from "./components/BarChart";
import { PieChart } from "./components/PieChart";
import { DataTable } from "./components/DataTable";
import { KPICard } from "./components/KPICard";
import { Text } from "./components/Text";
import { Tabs } from "./components/Tabs";
import { Grid } from "./components/Grid";

export const { registry } = defineRegistry(catalog, {
  components: {
    Card: shadcnComponents.Card,
    Stack: shadcnComponents.Stack,
    Heading: shadcnComponents.Heading,
    Button: shadcnComponents.Button,
    Input: shadcnComponents.Input,
    LineChart,
    BarChart,
    PieChart,
    DataTable,
    KPICard,
    Text,
    Tabs,
    Grid,
  },
});