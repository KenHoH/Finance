"use client";

import React from "react";
import { motion } from "framer-motion";
import { EmptyStateIllustration } from "./EmptyStateIllustration";
import type { EmptyStateProps } from "@/lib/types";

export const EmptyState = React.memo(function EmptyState({
  title,
  description,
  action,
  image,
}: EmptyStateProps){
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="col-span-full flex flex-col items-center justify-center p-10 border border-dashed border-border rounded-xl text-center"
    >
      {image ? (
        <div className="w-80 h-80 mb-6 rounded-2xl overflow-hidden flex items-center justify-center">
          <img src={image} alt="" className="w-full h-full object-contain" />
        </div>
      ) : (
        <EmptyStateIllustration className="w-80 h-80 mb-6 text-foreground" />
      )}
      <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      )}
      {action && <div>{action}</div>}
    </motion.div>
  );
});
