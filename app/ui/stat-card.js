'use client';
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const StatCard = ({ temperature, data }) => {
    return (
        <div className="stat-card">
            <div className="temperature">
                <i className="fas fa-thermometer-half"></i>
                <span>{temperature}°C</span>
            </div>
            <div className="chart">
                <LineChart width={400} height={300} data={data}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="temperature" stroke="#8884d8" />
                </LineChart>
            </div>
        </div>
    );
};

export default StatCard;