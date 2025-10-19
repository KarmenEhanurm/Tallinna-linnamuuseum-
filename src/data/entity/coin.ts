/**
 * Enum for representing coin sides
 */
export enum CoinSide {
    HEADS,
    TAILS
};

export interface Coin {
    id: string;
    title: string;
    date: string;
    description?: string;
    headImageResource?: any;
    tailsImageResource?: any;
};