import React from "react";
import { Card, CardBody } from "../ui/Card";

export function SummaryCards({ stats = {} }) {
  const {
    totalLive = 0,
    normal = 0,
    warnings = 0,
    critical = 0,
  } = stats;

  const cards = [
    {
      label: "Total Live",
      value: totalLive,
      color: "text-[#2b3674]",
    },
    {
      label: "Normal",
      value: normal,
      color: "text-emerald-500",
    },
    {
      label: "Warnings",
      value: warnings,
      color: "text-amber-500",
    },
    {
      label: "Critical",
      value: critical,
      color: "text-rose-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="border-slate-200">
          <CardBody>
            <p className="mt-1 text-xs text-[#2b3674]">{card.label}</p>

            <p className={`text-2xl font-semibold mt-2 ${card.color}`}>
              {card.value}
            </p>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
