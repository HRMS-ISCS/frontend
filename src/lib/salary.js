/**
 * Client-side salary previews. These mirror the backend formulas exactly so
 * HR sees the same numbers that will be printed.
 */

const EMPLOYER_PF_MONTHLY = 1800;

/** Python's built-in round(): exact .5 goes to the nearest even number. */
function pyRound(x) {
  const floor = Math.floor(x);
  const diff = x - floor;
  if (diff > 0.5) return floor + 1;
  if (diff < 0.5) return floor;
  return floor % 2 === 0 ? floor : floor + 1;
}

/**
 * The single CTC -> monthly breakup used by BOTH the letters and payroll
 * (appointment_letter_generator.calculate_salary_breakup and
 * payslip_calculator.calculate_salary_components). Employer PF is part of the
 * CTC but never paid out, so it is removed before the gross is split.
 */
function ctcBreakup(annualCtc) {
  const ctc = Number(annualCtc);
  if (!ctc || ctc <= EMPLOYER_PF_MONTHLY * 12) return null;
  const grossRaw = (ctc - EMPLOYER_PF_MONTHLY * 12) / 12;
  const basic = pyRound(grossRaw * 0.6);
  const hra = pyRound(basic * 0.4);
  const conveyance = pyRound(basic * 0.15);
  const cca = pyRound(grossRaw - basic - hra - conveyance);
  return { basic, hra, conveyance, cca, gross: basic + hra + conveyance + cca };
}

/** Offer / appointment letter breakup - appointment_letter_generator.calculate_salary_breakup */
export function letterSalaryBreakup(annualCtc) {
  const b = ctcBreakup(annualCtc);
  if (!b) return null;

  const employerPf = EMPLOYER_PF_MONTHLY;
  const { basic, hra, conveyance, cca, gross } = b;
  const professionalTax = 200;
  const employeePf = 1800;

  const row = (label, monthly, emphasis = false) => ({
    label,
    monthly,
    annual: monthly * 12,
    emphasis,
  });

  return {
    earnings: [
      row('Basic Salary', basic),
      row('House Rent Allowance', hra),
      row('Conveyance Allowance', conveyance),
      row('City Compensatory Allowance', cca),
      row('Gross Salary', gross, true),
    ],
    employer: [row('Employer PF', employerPf), row('CTC', gross + employerPf, true)],
    deductions: [
      row('Professional Tax', professionalTax),
      row('Employee PF', employeePf),
      row('Net Take-home', gross - employeePf - professionalTax, true),
    ],
  };
}

/** Salary structure components - payslip_calculator.calculate_salary_components */
export function payrollSalaryComponents(annualCtc) {
  const b = ctcBreakup(annualCtc);
  if (!b) return null;
  return { monthlyGross: b.gross, basic: b.basic, hra: b.hra, conveyance: b.conveyance, cca: b.cca };
}

/** Nearest rupee with .5 always rounding up - payslip_calculator.round_rupees */
const roundRupees = (value) => Math.floor(Number(value || 0) + 0.5);

/**
 * Payslip amounts - payslip_calculator.calculate_payslip_amounts.
 * Earnings are prorated by paid / working days and rounded per component;
 * on a full month CCA absorbs rounding drift so earnings equal gross.
 * Deductions are never prorated.
 */
export function payslipAmounts(structure, workingDays, paidDays, tds = 0) {
  const working = Number(workingDays);
  const paid = Number(paidDays);
  if (!structure || !(working > 0) || !(paid >= 0) || paid > working) return null;

  const ratio = paid / working;
  const basic = roundRupees(structure.basic_salary * ratio);
  const hra = roundRupees(structure.hra * ratio);
  const conveyance = roundRupees(structure.conveyance_allowance * ratio);
  let cca = roundRupees(structure.cca * ratio);
  let totalEarnings = basic + hra + conveyance + cca;

  if (paid === working) {
    const gross = roundRupees(structure.basic_salary + structure.hra + structure.conveyance_allowance + structure.cca);
    if (gross !== totalEarnings) {
      cca += gross - totalEarnings;
      totalEarnings = gross;
    }
  }

  const pf = roundRupees(structure.pf);
  const esi = roundRupees(structure.esi);
  const professionalTax = roundRupees(structure.professional_tax);
  const healthInsurance = roundRupees(structure.health_insurance);
  const tdsAmount = roundRupees(tds);
  const totalDeductions = pf + esi + professionalTax + tdsAmount + healthInsurance;

  return {
    earnings: [
      { label: 'Basic salary', value: basic },
      { label: 'House rent allowance', value: hra },
      { label: 'Conveyance allowance', value: conveyance },
      { label: 'City compensatory allowance', value: cca },
    ],
    deductions: [
      { label: 'Provident fund', value: pf },
      { label: 'ESI', value: esi },
      { label: 'Professional tax', value: professionalTax },
      { label: 'Income tax (TDS)', value: tdsAmount },
      { label: 'Health insurance', value: healthInsurance },
    ],
    totalEarnings,
    totalDeductions,
    netSalary: totalEarnings - totalDeductions,
    gross: roundRupees(structure.monthly_gross),
  };
}

/** Indian English words, "Twelve Lakhs Fifty Thousand" */
const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven',
  'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n) {
  return n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]} ${ONES[n % 10]}`.trim();
}

export function numberToIndianWords(value) {
  let n = Math.floor(Number(value) || 0);
  if (n === 0) return 'Zero';
  const parts = [];
  const unit = (size, singular, plural) => {
    if (n >= size) {
      const v = Math.floor(n / size);
      parts.push(`${twoDigits(v)} ${v > 1 ? plural : singular}`);
      n %= size;
    }
  };
  unit(10000000, 'Crore', 'Crores');
  unit(100000, 'Lakh', 'Lakhs');
  if (n >= 1000) {
    parts.push(`${twoDigits(Math.floor(n / 1000))} Thousand`);
    n %= 1000;
  }
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n > 0) parts.push(twoDigits(n));
  return parts.join(' ');
}
