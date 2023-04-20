import axios from "axios";

/**
 * Searches hotel using query string
 * @param searchQuery - the string to query hotels by
 */
async function searchHotels(searchQuery: string) {
    const hotelData = [[["AtySUc", JSON.stringify([searchQuery]), null, "1"]]];
    const queryData = encodeURIComponent(JSON.stringify(hotelData));
    const { data } = await axios({
        method: "POST",
        url: "	https://www.google.com/_/TravelFrontendUi/data/batchexecute",
        data: `f.req=${queryData}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    });

    const [, , str] = data.split("\n");
    const [arr] = JSON.parse(str ?? "[]");
    const [, , str2] = arr ?? [];
    const [list, hotel, entity] = JSON.parse(str2 ?? "[]");
    const [dataArr] = list ?? [];
    const [[, resultArr]] = dataArr ?? [[]];

    if (!resultArr) {
        const [urlPath] = entity ?? [];
        const [, name] = hotel ?? [];

        if (!name || !urlPath) return [];
        if (!(urlPath as string).startsWith("/travel/hotels/entity/")) return [];

        return [
            {
                id: urlPath.split("?")[0].replace("/travel/hotels/entity/", ""),
                name,
            }
        ];
    }


    const result = (resultArr as Array<any>).map((x: any) => {
        const [i, obj] = x;
        const data = {
            name: "",
            id: "",
        };

        // Looks like 34 is for hotel data
        if (i !== 34) return data;

        const [[k, v]] = Object.entries(obj ?? {});
        const [hotelData] = (v as Array<any>) ?? [];
        if (!hotelData || !Array.isArray(hotelData)) return data;

        data.name = hotelData[1];
        data.id = hotelData[20];

        return data;
    }).filter(x => (x.name && x.id));

    return result;
}

/**
 * @param hotel_id - Hotel unique identifier, used by google travel website. This is returned by the hotel search API 
 * @param date_start - starting date as number array. Example : [2023, 6, 1]
 * @param date_end - ending date as number array. Example : [2023, 8, 1]
 */
async function getHotelPrices(hotel_id: string, date_start: number[], date_end: number[]) {
    const hotelData = [[["yY52ce", `[null,[${JSON.stringify(date_start)},${JSON.stringify(date_end)},1],[2,[],0],\"${hotel_id}\",\"USD\"]`, null, "generic"]]];
    const queryData = encodeURIComponent(JSON.stringify(hotelData));
    const { data } = await axios({
        method: "POST",
        url: "	https://www.google.com/_/TravelFrontendUi/data/batchexecute",
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
    const dayTrip = new Date(flight_dates[1]).getDate() - new Date(flight_dates[0]).getDate();
    const flightData = [
        null,
        [null, null, 1, null, [], 1, [1, 0, 0, 0], null, null, null, null, null, null, [[[[[from, 0]]], [[[to, 0]]], null, (isNonStopOnly ? 1 : 0), [], [], flight_dates[0], null, [], [], [], null, null, [], 3], [[[[to, 4]]], [[[from, 4]]], null, (isNonStopOnly ? 1 : 0), [], [], flight_dates[1], null, [], [], [], null, null, [], 3]], null, null, null, true, null, null, null, null, null, [], null, null, null],
        date_range,
        null,
        [
            dayTrip,
            dayTrip
        ]
    ];
    console.log({ flight_dates, dayTrip });

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

export {
    getHotelPrices,
    getFlightPrices,
    searchHotels,
};