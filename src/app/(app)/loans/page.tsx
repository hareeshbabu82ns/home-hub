import { Card } from "@/components/ui/card";
import { calculateEMISplitsWithStats } from "@/lib/loans/calc";
import { ExtraPayment, LoanData } from "@/lib/loans/types";
import EmiSPlitsBarChart from "./emi-splits-bar-chart";
import { EMISplitsStatsPieChart } from "./emi-splits-stats-pie-chart";

export default async function Home() {
  const loanData: LoanData = {
    amount: 43000,
    roi: 4.5,
    term: 240,
    emi: 0,
    startDate: Date.parse( "2020-03-01" ).valueOf(),
    emiPaid: 1440,
  };

  const loanExtraPayments: ExtraPayment[] = [];

  loanExtraPayments.push( {
    amount: 20000,
    date: Date.parse( "2022-07-04" ).valueOf(),
  } );
  loanExtraPayments.push( {
    amount: 10000,
    date: Date.parse( "May 10, 2023" ).valueOf(),
  } );

  const splits = calculateEMISplitsWithStats( loanData, [], [], true );
  const splitsExtras = calculateEMISplitsWithStats(
    { ...loanData, emiPaid: 2044 },
    [],
    loanExtraPayments,
    true,
  );

  return (
    <main className="my-4 space-y-4">
      <h1 className="text-2xl font-semibold">Loans</h1>
      <Card>
        <pre>{JSON.stringify( loanData, null, 2 )}</pre>
      </Card>
      <div className="flex flex-row gap-4">
        <EMISplitsStatsPieChart stats={splits.stats} title="Base Splits" />
        <EMISplitsStatsPieChart
          stats={splitsExtras.stats}
          title="Splits with extras"
        />
      </div>
      <div className="flex flex-row gap-4">
        <EmiSPlitsBarChart splits={splits.splits} title="Base Splits" />
        <EmiSPlitsBarChart
          splits={splitsExtras.splits}
          title="Splits with extras"
        />
      </div>
      <div className="flex flex-row gap-4">
        <Card className="flex-1">
          <pre>{JSON.stringify( splits, null, 2 )}</pre>
        </Card>
        <Card className="flex-1">
          <pre>{JSON.stringify( splitsExtras, null, 2 )}</pre>
        </Card>
      </div>
    </main>
  );
}
