"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface SearchResultsProps {
  results: any[];
  loading: boolean;
  onSelect: (playerId: number) => void;
  onClose: () => void;
}

export function SearchResults({
  results,
  loading,
  onSelect,
  onClose,
}: SearchResultsProps) {
  if (loading) {
    return (
      <Card className="absolute top-full left-0 right-0 z-50 mt-2">
        <CardContent className="p-4">
          <p className="text-muted-foreground text-center">Searching...</p>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-24">
      <Card className="w-full max-w-2xl mx-4 max-h-[70vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Search Results</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {results.map((player: any) => (
            <div
              key={player.id || player.duprId}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => {
                onSelect(player.id || player.duprId);
                onClose();
              }}
            >
              <div>
                <p className="font-medium">{player.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {player.shortAddress || player.location || ""}
                </p>
              </div>
              <div className="text-right">
                {player.doubles != null && (
                  <p className="text-sm">
                    Doubles:{" "}
                    <span className="font-bold text-green-400">
                      {typeof player.doubles === "number"
                        ? player.doubles.toFixed(2)
                        : player.doubles}
                    </span>
                  </p>
                )}
                {player.singles != null && (
                  <p className="text-sm">
                    Singles:{" "}
                    <span className="font-bold text-blue-400">
                      {typeof player.singles === "number"
                        ? player.singles.toFixed(2)
                        : player.singles}
                    </span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
