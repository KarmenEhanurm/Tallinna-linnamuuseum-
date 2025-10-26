/**
 * Enum for representing coin sides
 */
export enum CoinSide {
    HEADS,
    TAILS
};

export interface Coin {
    id: number;
    title: string;
    date?: string | null;
    description?: string | null;
    diameter?: number;
    weight?: number;
    material?: string;
    headDescription?: string;
    tailsDescription?: string;
    headImageResource?: any;
    tailsImageResource?: any;
};