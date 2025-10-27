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
    weight?: number;
    material?: string;
    headDescription?: string;
    tailsDescription?: string;
    diameterMm: number;
    headImageResource?: any;
    tailsImageResource?: any;
};