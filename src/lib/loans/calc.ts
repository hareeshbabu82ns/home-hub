import {
  addMonths,
  endOfYear,
  isAfter,
  isSameDay,
  isSameMonth,
  isSameYear,
  toDate,
} from "date-fns";
import type {
  EMIRecord,
  EMISplit,
  EMISplitStats,
  ExtraPayment,
  RateOfInterest,
  SplitsWithStats,
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
  // const monthAgo = subMonths(date, 1);
  extraPayments.forEach((payment) => {
    if (isSameMonth(date, payment.date)) {
      // if (isAfter(monthAgo, payment.date) && isBefore(date, payment.date)) {
      // console.log({ monthAgo, paymentDate: toDate(payment.date), date });
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
  if (amount === 0 || roi === 0 || emiPaid === 0) return [];

  let currentROI = roi;
  let date = toDate(startDate);
  let balancePrinciple = amount;
  let iterationCount = 0;
  const maxIterations = 600; // Safety guard: max 50 years (600 months)

  while (balancePrinciple > 0 && iterationCount < maxIterations) {
    iterationCount++;

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

    // Safety check: if principle is 0 or negative, we might have an issue
    if (split.principle <= 0) {
      console.warn(
        "Loan calculation issue: principle payment is zero or negative",
      );
      break;
    }

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
): SplitsWithStats => {
  const splits = calculateEMISplits(
    loanData,
    roiChanges,
    extraPayments,
    byYear,
  );

  const stats: EMISplitStats = {
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
