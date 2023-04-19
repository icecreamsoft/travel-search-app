import express from "express";

import { getFlightPrices, getHotelPrices } from "./travel";

const app = express();

app.use(express.static(__dirname + "/../public"));

app.get("/api/v0/flights", async (req, res) => {
    const { from, to, start, end, nonStop } = req.query as { [key: string]: string };
    if (!from || !to || !start || !end) return res.json({
        code: 400,
        message: "required query params: from, to, start, end",
    });

    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setDate(Math.max(startDate.getDate(), endDate.getDate() + 120));

    const data = await getFlightPrices(
        from, to,
        [start, end],
        [startDate.toISOString().split("T")[0], endDate.toISOString().split("T")[0]],
        nonStop === "1",
    );

    res.json({
        code: 200,
        data: data ?? [],
    });
});

app.get("/api/v0/hotels", async (req, res) => {
    const { hotel, start, end } = req.query as { [key: string]: string };
    if (!hotel || !start || !end) return res.json({
        code: 400,
        message: "required query params: hotel, start, end",
    });

    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setDate(Math.max(startDate.getDate(), endDate.getDate() + 120));

    const startArr = startDate.toISOString().split("T")[0].split("-").map(s => parseInt(s));
    const endArr = endDate.toISOString().split("T")[0].split("-").map(s => parseInt(s));

    const data = await getHotelPrices(
        hotel,
        startArr,
        endArr,
    );

    res.json({
        code: 200,
        data: data ?? [],
    });
});

export {
    app,
};