"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { OpponentStats } from "@/lib/analytics";

export function OpponentsTable({
  opponents,
  limit,
  onPlayerClick,
}: {
  opponents: OpponentStats[];
  limit?: number;
  onPlayerClick?: (id: number) => void;
}) {
  const displayed = limit ? opponents.slice(0, limit) : opponents;

  if (opponents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Most-Faced Opponents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No opponent data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Most-Faced Opponents
          {limit && opponents.length > limit && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              (top {limit} of {opponents.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Opponent</TableHead>
              <TableHead className="text-center">Matches</TableHead>
              <TableHead className="text-center">Record</TableHead>
              <TableHead className="text-center">Win Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayed.map((o, i) => (
              <TableRow
                key={o.id}
                className={onPlayerClick ? "cursor-pointer hover:bg-muted/50" : ""}
                onClick={() => onPlayerClick?.(o.id)}
              >
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="font-medium">{o.name}</TableCell>
                <TableCell className="text-center">{o.matches}</TableCell>
                <TableCell className="text-center">
                  <span className="text-green-400">{o.wins}W</span>
                  {" - "}
                  <span className="text-red-400">{o.losses}L</span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    className={
                      o.winRate >= 0.5
                        ? "bg-green-600/20 text-green-400 border-green-600/30"
                        : "bg-red-600/20 text-red-400 border-red-600/30"
                    }
                  >
                    {(o.winRate * 100).toFixed(0)}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
