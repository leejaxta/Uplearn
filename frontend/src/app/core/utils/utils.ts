import * as CryptoJS from 'crypto-js';

export function generateEsewaSignature(
  totalAmount: number,
  transactionId: string,
  productCode: string
): string {
  const secretKey: string = '8gBm/:&EnhH.1/q';
  const data: string = `total_amount=${totalAmount},transaction_uuid=${transactionId},product_code=${productCode}`;
  const hash: CryptoJS.lib.WordArray = CryptoJS.HmacSHA256(data, secretKey);
  return CryptoJS.enc.Base64.stringify(hash);
}

export function formatWeekLabel(week: string): string {
  const [start, end] = week.split(' to ');

  const startDate: Date = new Date(start);
  const endDate: Date = new Date(end);

  const options: Intl.DateTimeFormatOptions = { month: 'short' };
  const startMonth: string = startDate.toLocaleDateString('en-US', options);
  const endMonth: string = endDate.toLocaleDateString('en-US', options);

  const startDay: number = startDate.getDate();
  const endDay: number = endDate.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }
}
