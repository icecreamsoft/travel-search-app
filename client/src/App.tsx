import { useState, useEffect } from 'react'
import { atom, useAtom } from 'jotai';
import { loadable } from 'jotai/utils';

const initQuery = {
    from: "",
    to: "",
    start: "",
    end: "",
    hotel: "",
    nonStop: "1",
};

const searchHotelQueryAtom = atom("");
const searchHotelAtom = atom(async (get) => {
    const q = get(searchHotelQueryAtom);
    if (!q) return null;

    const hotelSearch = await fetch("/api/v0/hotels/search?" + new URLSearchParams({ q }));
    const { data } = await hotelSearch.json();

    console.log("hotels", data);

    const arr = (data as Array<any>).map((x: any) => {
        const { id, name } = x;

        return {
            id: id as string,
            name: name as string,
        };
    });

    return arr;
});
const asyncSearchHotelAtom = loadable(searchHotelAtom);

const searchQueryAtom = atom(initQuery)
const searchAtom = atom(async (get) => {
    const q = get(searchQueryAtom);
    if (!q.from || !q.to || !q.start || !q.end || !q.hotel) return null;

    const flightQuery = await fetch("/api/v0/flights?" + new URLSearchParams(q));
    const hotelQuery = await fetch("/api/v0/hotels?" + new URLSearchParams(q));

    const flights = (await flightQuery.json());
    const hotels = (await hotelQuery.json());

    const prices = (flights.data as Array<any>).map((x: any) => {
        const d = {
            startDate: x.startDate as string,
            endDate: x.endDate as string,
            flightPrice: x.usd as number,
            hotelPrice: -1,
            totalPrice: -1,
        };

        return [d.startDate, d] as [string, typeof d];
    });

    const resultMap = new Map(prices);
    const min = {
        price: -1,
        startDate: "",
        endDate: "",
    };

    (hotels.data as Array<any>).forEach((x: any) => {
        const date = x.date as string;
        const find = resultMap.get(date);
        if (!find || !find.flightPrice) return;

        find.hotelPrice = x.usd as number;
        if (!find.flightPrice || !find.hotelPrice) return;

        find.totalPrice = (find.flightPrice + find.hotelPrice);

        if (min.price === -1 || min.price > find.totalPrice) {
            min.price = find.totalPrice;
            min.startDate = find.startDate;
            min.endDate = find.endDate;
        }
    });

    return {
        min,
        prices: resultMap
    };
});
const asyncSearchAtom = loadable(searchAtom);

function SearchResult() {

    const [searchValue] = useAtom(asyncSearchAtom);

    if (searchValue.state === "hasError" || searchValue.state === "loading" || searchValue.data == null) {
        return <div className="transition-opacity ease-in duration-800 opacity-0"></div>
    }

    const { prices, min } = searchValue.data;

    const drawResult = () => {
        const result = [];
        for (const [k, v] of prices) {
            if (!v.flightPrice || v.hotelPrice < 0) continue;

            const color = (v.totalPrice - min.price) > 100 ? "text-red-500" : ((v.totalPrice - min.price) > 0 ? "text-green-500" : "text-gray-500");
            const rowStyle = (v.totalPrice - min.price) > 0 ? "" : "bg-green-50 font-bold";
            result.push(<tr key={`key-${k}`} className={`${rowStyle}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {v.startDate} - {v.endDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${v.flightPrice}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${v.hotelPrice}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${v.totalPrice}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${color}`}>
                    ${v.totalPrice - min.price}
                </td>
            </tr>);
        }

        return result;
    }


    return (
        <div className="transition-opacity ease-in duration-800 opacity-100">
            <p className="p-4 mt-8">In the next 4 months, the dates : <b>{min.startDate} - {min.endDate}</b> has the cheapest cost of <b>${min.price}</b></p>
            <table className="min-w-full divide-y divide-gray-200 mt-8">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Dates
                        </th>
                        <th scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Flight Price
                        </th>
                        <th scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hotel Price
                        </th>
                        <th scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                        </th>
                        <th scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price Diff
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {drawResult()}
                </tbody>
            </table>
        </div>
    )
}

function FlightSearch() {

    // atoms
    const [, setQuery] = useAtom(searchQueryAtom);
    const [, setHotelQuery] = useAtom(searchHotelQueryAtom);
    const [hotelSearchValue] = useAtom(asyncSearchHotelAtom);

    // state
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [numDays, setNumDays] = useState(1);
    const [hotel, setHotel] = useState("");
    const [stop, setStop] = useState(true);
    const [selectHotel, setSelectHotel] = useState("");

    const [hotelQueryTimer, setHotelQueryTimer] = useState(0);

    const onSearchClick = function () {
        const now = new Date();
        const next = new Date();
        next.setDate(now.getDate() + numDays);
        const start = now.toISOString().split("T")[0];
        const end = next.toISOString().split("T")[0];

        setQuery({
            from,
            to,
            start,
            end,
            hotel: selectHotel,
            nonStop: stop ? "1" : "0",
        });
    };

    // effect
    useEffect(() => {
        clearTimeout(hotelQueryTimer);
        const timer = setTimeout(function () {
            setHotelQuery(hotel);
        }, 1000);
        setHotelQueryTimer(+timer);
    }, [hotel]);


    const hotelList = hotelSearchValue && hotelSearchValue.state === "hasData" ? hotelSearchValue.data : [];
    const renderHotelOptions = () => {
        return (hotelList ?? []).map(
            (x, i) => <option key={`hotel-select-${i}`} value={x.id}>{x.name}</option>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-lg px-6 py-8">
            <h1 className="text-2xl font-bold mb-8">Search for Flights and Hotels</h1>
            <form className="flex flex-wrap -mx-2" autoComplete='off'>
                <div className="w-full md:w-1/2 px-2 mt-4 mb-4 md:mb-0">
                    <label htmlFor="departure" className="block text-gray-700 font-bold mb-2">Departure</label>
                    <input list="destination" id="departure" name="departure" placeholder="Airport Code (example, JFK)"
                        className="w-full border rounded-lg px-3 py-2" onChange={(e) => { setFrom(e.target.value); }} value={from} />
                </div>
                <div className="w-full md:w-1/2 px-2 mt-4 mb-4 md:mb-0">
                    <label htmlFor="destination" className="block text-gray-700 font-bold mb-2">Destination</label>
                    <input type="text" id="destination" name="destination" placeholder="Airport Code (example, SFO)"
                        className="w-full border rounded-lg px-3 py-2" onChange={(e) => { setTo(e.target.value); }} value={to} />
                </div>
                <div className="w-full px-2 mt-4 mb-4 md:mb-0">
                    <label htmlFor="hotel" className="block text-gray-700 font-bold mb-2">Search Hotel</label>
                    <input type="text" id="hotel" name="hotel" placeholder="Search for Hotel (example, SFO Hotels)"
                        className="w-full border rounded-lg px-3 py-2" onChange={(e) => { setHotel(e.target.value); }} value={hotel} />
                </div>
                <div className="w-full md:w-1/2 px-2 mt-4 mb-4 md:mb-0">
                    <label htmlFor="selectHotel" className="block text-gray-700 font-bold mb-2">Select Hotel</label>
                    <select id="selectHotel" name="selectHotel"
                        className="w-full border rounded-lg px-3 py-2" onChange={(e) => { setSelectHotel(e.target.value) }} value={selectHotel}
                        disabled={(!hotelList || hotelList.length === 0)}>
                        {renderHotelOptions()}
                    </select>
                </div>
                <div className="w-full md:w-1/2 px-2 mt-4 mb-4 md:mb-0">
                    <label htmlFor="numdays" className="block text-gray-700 font-bold mb-2">Length of Stay (nights)</label>
                    <input type="number" id="numdays" name="numdays"
                        className="w-full border rounded-lg px-3 py-2" onChange={(e) => { setNumDays(parseInt(e.target.value)); }} value={numDays} />
                </div>
                <div className="w-full md:w-1/2 px-2 mt-4 mb-4 md:mb-0">
                    <div className="flex items-center mt-4 mb-4">
                        <input type="checkbox" id="nonstop" name="nonstop"
                            className="px-3 py-2" onChange={(e) => { setStop(!stop); }} checked={stop} />
                        <label htmlFor="nonstop" className="block text-gray-700 font-bold ml-4">Non-stop flights only?</label>
                    </div>
                </div>
                <div className="w-full px-2 mt-16">
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                        onClick={(e) => { e.preventDefault(); onSearchClick(); }}>
                        Search
                    </button>
                </div>
            </form>

            <SearchResult />
        </div>
    );
}

function App() {
    return (
        <div className="container mx-auto py-4">
            <FlightSearch />
        </div>
    )
}

export default App
