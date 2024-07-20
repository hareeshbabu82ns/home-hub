import {
  addMonths,
  endOfYear,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isSameYear,
  sub,
  subMonths,
  toDate,
} from "date-fns";
import {
  EMIRecord,
  EMISplit,
  ExtraPayment,
  LoanData,
  RateOfInterest,
} from "./types";

export const calculateEMI = (amount: number, roi: number, term: number) => {
  // p * r * ( ((1+r) ^ n) / (((1+r) ^ n) - 1 ))

  const r = roi / 12 / 100;

  const rTmp = Math.pow(1 + r, term);

  return Math.round(amount * r * (rTmp / (rTmp - 1)));
};

const getROIOfMonth = (
  date: Date,
  currentROI: number,
  roiChanges: RateOfInterest[],
) => {
  let roi = currentROI;
  roiChanges.forEach((roiChg) => {
    if (isSameDay(date, roiChg.startDate) && isAfter(date, roiChg.startDate)) {
      roi = roiChg.roi;
    }
  });
  return roi;
};

const getExtraPaymentsOfMonth = (date: Date, extraPayments: ExtraPayment[]) => {
  let amount = 0;
  const monthAgo = subMonths(date, 1);
  extraPayments.forEach((payment) => {
    if (isSameMonth(date, payment.date)) {
      // if (isAfter(monthAgo, payment.date) && isBefore(date, payment.date)) {
      console.log({ monthAgo, paymentDate: toDate(payment.date), date });
      amount += payment.amount;
    }
  });
  return amount;
};

export const calculateEMISplits = (
  { amount, roi, emiPaid, startDate }: EMIRecord,
  roiChanges: RateOfInterest[],
  extraPayments: ExtraPayment[],
  byYear: boolean = false,
): EMISplit[] => {
  const splits: EMISplit[] = [];
  if (amount === 0) return [];
  let currentROI = roi;

  let date = toDate(startDate);

  let balancePrinciple = amount;

  while (balancePrinciple > 0) {
    if (roiChanges) currentROI = getROIOfMonth(date, currentROI, roiChanges);

    const r = currentROI / 12 / 100;

    const split: EMISplit = {
      date: date.valueOf(),
      emiPaid,
      principle: 0,
      interest: 0,
      balancePrinciple: 0,
      finishedPercent: 0,
    };

    let extraAmount = 0;
    if (extraPayments)
      extraAmount = getExtraPaymentsOfMonth(date, extraPayments);

    split.emiPaid += extraAmount;

    split.interest = Math.round(balancePrinciple * r);

    if (balancePrinciple + split.interest < split.emiPaid)
      split.emiPaid = balancePrinciple + split.interest;

    split.principle = split.emiPaid - split.interest;
    balancePrinciple -= split.principle;
    split.balancePrinciple = balancePrinciple;
    split.finishedPercent =
      Math.round(10000 - (balancePrinciple / amount) * 10000) / 100;

    splits.push(split);
    date = addMonths(date, 1);

    // console.log(
    //   moment(split.date).format("MMM YY"),
    //   currentROI,
    //   split.principle,
    //   split.interest,
    //   split.balancePrinciple,
    //   split.finishedPercent
    // );
  }

  if (byYear) {
    const yearSplits: EMISplit[] = [];

    const mStartDate = toDate(startDate);
    let currYearDate = endOfYear(mStartDate);

    let currentSplit: EMISplit | null = null;

    splits.forEach((split) => {
      if (isSameYear(currYearDate, split.date)) {
        if (currentSplit === null) {
          currentSplit = { ...split };
          currentSplit.date = currYearDate.valueOf();
        } else {
          currentSplit.principle += split.principle;
          currentSplit.interest += split.interest;
          currentSplit.balancePrinciple = split.balancePrinciple;
          currentSplit.finishedPercent = split.finishedPercent;
        }
      } else {
        currYearDate = endOfYear(split?.date);
        // console.log(
        //   moment(currentSplit.date).format("MMM, YY"),
        //   currentSplit.principle,
        //   currentSplit.finishedPercent
        // );
        currentSplit = { ...split };
        currentSplit.date = currYearDate.valueOf();
        yearSplits.push(currentSplit);
      }
    });
    if (currentSplit) yearSplits.push(currentSplit);
    return yearSplits;
  } else return splits;
};

export const calculateEMISplitsWithStats = (
  loanData: EMIRecord,
  roiChanges: RateOfInterest[],
  extraPayments: ExtraPayment[],
  byYear: boolean = false,
) => {
  const splits = calculateEMISplits(
    loanData,
    roiChanges,
    extraPayments,
    byYear,
  );

  const stats = {
    total: 0,
    interest: 0,
    interestPercent: 0,
  };

  if (splits) {
    splits.forEach((split) => {
      stats.interest += split.interest;
    });
    stats.total = loanData.amount + stats.interest;
    stats.interestPercent =
      Math.round((stats.interest / stats.total) * 1000) / 10;
  }
  // console.log("Stats: ", stats.total, stats.interest, stats.interestPercent);
  return { splits, stats };
};
// export { calculateEMI };

const loanData: LoanData = {
  amount: 4500000,
  roi: 12.5,
  term: 240,
  emi: 0,
  startDate: Date.parse("2015-07-10").valueOf(), //Date.now(),
  emiPaid: 51200,
};

// console.log("EMI:", calculateEMI(loanData.amount, loanData.roi, loanData.term));
// console.log("Splits:\n", JSON.stringify(calculateEMISplits(loanData), null, 2));
// console.log("Splits:");
calculateEMISplitsWithStats(loanData, [], [], true);

const loanROIChanges: RateOfInterest[] = [];

let loanROIChg = {
  roi: 11.25,
  startDate: Date.parse("2017-03-10").valueOf(), //Date.now(),
  emiPaid: 51200,
};
loanROIChanges.push(loanROIChg);

loanROIChg = {
  roi: 10.5,
  startDate: Date.parse("2015-10-10").valueOf(), //Date.now(),
  emiPaid: 1100,
};
loanROIChanges.push(loanROIChg);

const loanExtraPayments: ExtraPayment[] = [];

let loanExtraPay = {
  amount: 50000,
  date: Date.parse("2018-01-25").valueOf(),
};
loanExtraPayments.push(loanExtraPay);

loanExtraPay = {
  amount: 50000,
  date: Date.parse("2018-02-25").valueOf(),
};
loanExtraPayments.push(loanExtraPay);

loanExtraPay = {
  amount: 50000,
  date: Date.parse("2018-02-25").valueOf(),
};
loanExtraPayments.push(loanExtraPay);

loanExtraPay = {
  amount: 50000,
  date: Date.parse("2020-10-10").valueOf(),
};
loanExtraPayments.push(loanExtraPay);

// console.log("Splits (with ROI Change):");
// calculateEMISplitsWithStats(loanData, loanROIChanges);

// console.log("Splits (with ROI Change + Extra Amounts):");
// calculateEMISplitsWithStats(loanData, loanROIChanges, loanExtraPayments);

// console.log("Yearly Splits (with ROI Change + Extra Amounts):");
// calculateEMISplitsWithStats(loanData, loanROIChanges, loanExtraPayments, true);

// console.log(
//   "Splits (with ROI Change):\n",
//   JSON.stringify(calculateEMISplits(loanData, loanROIChanges), null, 2)
// );
