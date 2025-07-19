"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { calculateEMISplitsWithStats, calculateEMI } from "@/lib/loans/calc";
import { ExtraPayment, LoanData } from "@/lib/loans/types";
import EmiSPlitsBarChart from "./emi-splits-bar-chart";
import { EMISplitsStatsPieChart } from "./emi-splits-stats-pie-chart";
import { format } from "date-fns";

export default function LoansPage() {
  const [loanInputs, setLoanInputs] = useState({
    amount: 43000,
    roi: 4.5,
    term: 240,
    startDate: "2020-03-01",
  });

  const [extraPayments, setExtraPayments] = useState<ExtraPayment[]>([
    {
      amount: 20000,
      date: Date.parse("2022-07-04").valueOf(),
    },
    {
      amount: 10000,
      date: Date.parse("May 10, 2023").valueOf(),
    },
  ]);

  const [showExtras, setShowExtras] = useState(true);

  const handleInputChange = (field: string, value: string | number) => {
    setLoanInputs((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculateLoans = () => {
    // Calculate EMI first
    const emi = calculateEMI(
      loanInputs.amount,
      loanInputs.roi,
      loanInputs.term,
    );

    const loanData: LoanData = {
      amount: loanInputs.amount,
      roi: loanInputs.roi,
      term: loanInputs.term,
      emi: emi,
      startDate: Date.parse(loanInputs.startDate).valueOf(),
      emiPaid: emi, // Use calculated EMI as the paid amount
    };

    // Add safety checks to prevent memory issues
    if (loanData.amount <= 0 || loanData.roi <= 0 || loanData.term <= 0) {
      return {
        baseSplits: {
          splits: [],
          stats: { total: 0, interest: 0, interestPercent: 0 },
        },
        splitsWithExtras: {
          splits: [],
          stats: { total: 0, interest: 0, interestPercent: 0 },
        },
      };
    }

    const baseSplits = calculateEMISplitsWithStats(loanData, [], [], true);
    const splitsWithExtras = calculateEMISplitsWithStats(
      loanData,
      [],
      extraPayments,
      true,
    );

    return { baseSplits, splitsWithExtras };
  };

  const { baseSplits, splitsWithExtras } = useMemo(() => {
    return calculateLoans();
  }, [
    loanInputs.amount,
    loanInputs.roi,
    loanInputs.term,
    loanInputs.startDate,
    extraPayments,
  ]);

  const calculatedEMI = useMemo(() => {
    if (loanInputs.amount > 0 && loanInputs.roi > 0 && loanInputs.term > 0) {
      return calculateEMI(loanInputs.amount, loanInputs.roi, loanInputs.term);
    }
    return 0;
  }, [loanInputs.amount, loanInputs.roi, loanInputs.term]);

  return (
    <main className="space-y-6 p-4">
      <h1 className="text-3xl font-bold">Loan Calculator</h1>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Loan Amount</Label>
              <Input
                id="amount"
                type="number"
                value={loanInputs.amount}
                onChange={(e) =>
                  handleInputChange("amount", Number(e.target.value))
                }
                placeholder="Enter loan amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roi">Rate of Interest (%)</Label>
              <Input
                id="roi"
                type="number"
                step="0.1"
                value={loanInputs.roi}
                onChange={(e) =>
                  handleInputChange("roi", Number(e.target.value))
                }
                placeholder="Enter ROI"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="term">Term (Months)</Label>
              <Input
                id="term"
                type="number"
                value={loanInputs.term}
                onChange={(e) =>
                  handleInputChange("term", Number(e.target.value))
                }
                placeholder="Enter term in months"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={loanInputs.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <Button
              variant={showExtras ? "default" : "outline"}
              onClick={() => setShowExtras(!showExtras)}
            >
              {showExtras ? "Hide" : "Show"} Extra Payments
            </Button>
            {calculatedEMI > 0 && (
              <div className="text-muted-foreground text-sm">
                Monthly EMI:{" "}
                <span className="text-foreground font-medium">
                  ₹{calculatedEMI.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Overview */}
      {baseSplits.splits.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <EMISplitsStatsPieChart
            stats={baseSplits.stats}
            title="Base Loan Analysis"
            description="Interest vs Principal breakdown"
          />
          {showExtras && splitsWithExtras.splits.length > 0 && (
            <EMISplitsStatsPieChart
              stats={splitsWithExtras.stats}
              title="With Extra Payments"
              description="Impact of additional payments"
            />
          )}
        </div>
      )}

      {/* Payment Schedule Charts */}
      {baseSplits.splits.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <EmiSPlitsBarChart
            splits={baseSplits.splits}
            title="Base Payment Schedule"
            description="Monthly EMI breakdown over time"
          />
          {showExtras && splitsWithExtras.splits.length > 0 && (
            <EmiSPlitsBarChart
              splits={splitsWithExtras.splits}
              title="With Extra Payments"
              description="Optimized payment schedule"
            />
          )}
        </div>
      )}

      {/* Summary Cards */}
      {baseSplits.splits.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Base Loan Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-medium">
                  ₹{baseSplits.stats.total.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Interest:</span>
                <span
                  className="font-medium"
                  style={{ color: "hsl(var(--chart-1))" }}
                >
                  ₹{baseSplits.stats.interest.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Interest Percentage:
                </span>
                <span className="font-medium">
                  {baseSplits.stats.interestPercent.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          {showExtras && splitsWithExtras.splits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">With Extra Payments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-medium">
                    ₹{splitsWithExtras.stats.total.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Interest:</span>
                  <span
                    className="font-medium"
                    style={{ color: "hsl(var(--chart-1))" }}
                  >
                    ₹{splitsWithExtras.stats.interest.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Interest Percentage:
                  </span>
                  <span className="font-medium">
                    {splitsWithExtras.stats.interestPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Savings:</span>
                  <span
                    className="font-medium"
                    style={{ color: "hsl(var(--chart-4))" }}
                  >
                    ₹
                    {(
                      baseSplits.stats.interest -
                      splitsWithExtras.stats.interest
                    ).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </main>
  );
}
