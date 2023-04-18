import axios from "axios";

async function getHotelPrices(hotel_id: string, date_start: number[], date_end: number[]) {
    const hotelData = [[["yY52ce", `[null,[${JSON.stringify(date_start)},${JSON.stringify(date_end)},1],[2,[],0],\"${hotel_id}\",\"USD\"]`, null, "generic"]]];
    const queryData = encodeURIComponent(JSON.stringify(hotelData));
    const { data } = await axios({
        method: "POST",
        url: "	https://www.google.com/_/TravelFrontendUi/data/batchexecute",
        params: {
            "rcpids": "yY52ce",
            "source-path": `/travel/hotels/entity/${hotel_id}`,
        },
        data: `f.req=${queryData}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    });

    const [, , str] = data.split("\n");
    const [arr] = JSON.parse(str ?? "[]");
    const [, , str2] = arr ?? [];
    const [, dataArr] = JSON.parse(str2 ?? "[null, []]");
    const result = (dataArr as Array<any>).map((x: any) => {
        const [, , , , , , , , dateRange, price] = x;
        const [date] = dateRange ?? [];
        const [usd] = price ?? [];
        if (!usd) return {
            date: "",
            usd: -1
        };

        const dollar = (usd as string).replace(/\$/g, "").replace(/\,/g, "");
        const formattedDate = new Date(date).toISOString().split("T")[0];

        console.log({ usd, dollar, i: parseInt(dollar) });

        return {
            date: formattedDate,
            usd: parseInt(dollar)
        };
    })
        .filter(x => (x && x.date))
        .sort((a, b) => {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

    return result;
}

/**
 * Query price data for flight between a range of dates 
 * @param from - starting city code
 * @param to - destination city code
 * @param flight_dates - date of flight
 * @param date_range - date range for price data
 */
async function getFlightPrices(from: string, to: string, flight_dates: string[], date_range: string[], isNonStopOnly: boolean) {
    const flightData = [
        null,
        [null, null, 1, null, [], 1, [1, 0, 0, 0], null, null, null, null, null, null, [[[[[from, 0]]], [[[to, 0]]], null, (isNonStopOnly ? 1 : 0), [], [], flight_dates[0], null, [], [], [], null, null, [], 3], [[[[to, 4]]], [[[from, 4]]], null, (isNonStopOnly ? 1 : 0), [], [], flight_dates[1], null, [], [], [], null, null, [], 3]], null, null, null, true, null, null, null, null, null, [], null, null, null],
        date_range,
        null,
        [
            4,
            4
        ]
    ];
    console.log({ from, to, flight_dates, date_range });

    const queryData = encodeURIComponent(JSON.stringify([null, JSON.stringify(flightData)]));
    const { data } = await axios({
        method: "POST",
        url: "https://www.google.com/_/TravelFrontendUi/data/travel.frontend.flights.FlightsFrontendService/GetCalendarGraph",
        data: `f.req=${queryData}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    });

    const [, , str] = data.split("\n");
    const [arr] = JSON.parse(str ?? "[]");
    const [, , str2] = arr ?? [];
    const [, dataArr] = JSON.parse(str2 ?? "[null, []]");

    const result = (dataArr as Array<any>).map((x: any) => {
        const [startDate, endDate, price] = x;
        const [priceInfo] = price ?? [];
        const [, usd] = priceInfo ?? [];

        return {
            startDate: startDate as string,
            endDate: endDate as string,
            usd: usd as number,
        };
    }).filter((x: any) => (x && x.usd));

    return result;
}

// getFlightPrices("SEA", "SFO", ["2023-11-01", "2023-11-05"], ["2023-10-01", "2023-12-01"]).then(data => {
//     console.log(data);
// }).catch(ex => {
//     console.log(ex.toString());
// });

// getHotelPrices("ChkI57qoyvGZ6N1uGg0vZy8xMWMzeDhkdHdnEAE", [2023, 6, 1], [2023, 6, 30]).then(x => {
//     console.log(x);
// }).catch(ex => {
//     console.log(ex.toString());
// });

export {
    getHotelPrices,
    getFlightPrices,
};