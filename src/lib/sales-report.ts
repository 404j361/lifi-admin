export type SalesReportPreset = 'today' | 'week' | 'month' | 'year' | 'custom';

export type SalesReportPoint = {
	label: string;
	count: number;
};

export type SalesReportFilters = {
	preset: SalesReportPreset;
	startInput: string;
	endInput: string;
	label: string;
};

export type SalesReportResponse = {
	filters: SalesReportFilters;
	subscriptionKpis: {
		total: number;
		active: number;
		usersInRange: number;
		conversionRate: number;
		giveawayCount: number;
		paidCount: number;
	};
	subscriptionStatusStats: SalesReportPoint[];
	platformStats: SalesReportPoint[];
	subscriptionTrendStats: SalesReportPoint[];
	eventTypeStats: SalesReportPoint[];
};
