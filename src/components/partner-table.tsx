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

interface PartnerStats {
  name: string;
  duprId: number;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
}

export function PartnerTable({
  partners,
  onPlayerClick,
}: {
  partners: PartnerStats[];
  onPlayerClick?: (id: number) => void;
}) {
  if (partners.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Partner Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No doubles partner data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Doubles Partner Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partner</TableHead>
              <TableHead className="text-center">Matches</TableHead>
              <TableHead className="text-center">Record</TableHead>
              <TableHead className="text-center">Win Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners.map((p) => (
              <TableRow
                key={p.duprId}
                className={onPlayerClick ? "cursor-pointer hover:bg-muted/50" : ""}
                onClick={() => onPlayerClick?.(p.duprId)}
              >
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-center">{p.matches}</TableCell>
                <TableCell className="text-center">
                  <span className="text-green-400">{p.wins}W</span>
                  {" - "}
                  <span className="text-red-400">{p.losses}L</span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={p.winRate >= 0.5 ? "default" : "destructive"}
                    className={
                      p.winRate >= 0.5
                        ? "bg-green-600/20 text-green-400 border-green-600/30"
                        : "bg-red-600/20 text-red-400 border-red-600/30"
                    }
                  >
                    {(p.winRate * 100).toFixed(0)}%
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
