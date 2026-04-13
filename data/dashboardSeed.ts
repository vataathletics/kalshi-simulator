export type Opportunity = {
  id: string;
  title: string;
  probability: number;
  volume: number;
};

export const dashboardSeed: Opportunity[] = [
  {
    id: '1',
    title: 'Fed cuts rates in June',
    probability: 42,
    volume: 158230,
  },
  {
    id: '2',
    title: 'US CPI YoY below 3% next print',
    probability: 37,
    volume: 112044,
  },
  {
    id: '3',
    title: 'BTC above $90k by month-end',
    probability: 54,
    volume: 204912,
  },
];
