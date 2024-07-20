export interface RateOfInterest {
  roi: number;
  startDate: number;
  emiPaid: number;
}

export interface ExtraPayment {
  date: number;
  amount: number;
}

export interface EMIRecord {
  amount: number;
  roi: number;
  term: number;
  emiPaid: number;
  startDate: number;
}

export interface LoanData {
  amount: number;
  roi: number;
  term: number;
  startDate: number;
  emiPaid: number;
  emi: number;
}

export interface EMISplit {
  date: number;
  emiPaid: number;
  principle: number;
  interest: number;
  balancePrinciple: number;
  finishedPercent: number;
}
