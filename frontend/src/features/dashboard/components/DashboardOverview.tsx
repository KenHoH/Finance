"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, DollarSign, CreditCard, Activity } from "lucide-react";

const stats = [
  {
    title: "Total Balance",
    value: "$24,500.00",
    change: "+12.5%",
    trend: "up",
    icon: <DollarSign className="w-5 h-5 text-primary" />,
  },
  {
    title: "Monthly Expenses",
    value: "$3,240.50",
    change: "-2.4%",
    trend: "down",
    icon: <CreditCard className="w-5 h-5 text-red-500" />,
  },
  {
    title: "Investments",
    value: "$12,450.00",
    change: "+8.2%",
    trend: "up",
    icon: <Activity className="w-5 h-5 text-blue-500" />,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

export function DashboardOverview() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
    >
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          variants={itemVariants}
          whileHover={{ y: -5, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
          className="bg-card border border-border p-6 rounded-2xl shadow-sm transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-secondary rounded-xl">{stat.icon}</div>
            <span
              className={`flex items-center text-sm font-semibold px-2 py-1 rounded-md ${
                stat.trend === "up"
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-red-500/10 text-red-500"
              }`}
            >
              {stat.trend === "up" ? (
                <ArrowUpRight className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 mr-1" />
              )}
              {stat.change}
            </span>
          </div>
          <div>
            <h3 className="text-muted-foreground text-sm font-medium mb-1">{stat.title}</h3>
            <h2 className="text-3xl font-bold text-foreground">{stat.value}</h2>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
