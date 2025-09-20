// src/BaseballDiamond.jsx
import React from "react";

const BaseballDiamond = ({ runnerOn }) => {
  return (
    <svg viewBox="0 0 200 200" className="w-64 h-64 mx-auto">
      {/* Diamond */}
      <polygon
        points="100,20 180,100 100,180 20,100"
        fill="#2e7d32"
        stroke="#fff"
        strokeWidth="3"
      />

      {/* Bases */}
      <rect
        x="90"
        y="10"
        width="20"
        height="20"
        fill={runnerOn.second ? "#4ade80" : "#ddd"}
        transform="rotate(45 100 20)"
      />
      <rect
        x="170"
        y="90"
        width="20"
        height="20"
        fill={runnerOn.first ? "#4ade80" : "#ddd"}
        transform="rotate(45 180 100)"
      />
      <rect
        x="10"
        y="90"
        width="20"
        height="20"
        fill={runnerOn.third ? "#4ade80" : "#ddd"}
        transform="rotate(45 20 100)"
      />
      <rect
        x="90"
        y="170"
        width="20"
        height="20"
        fill="#fff"
        transform="rotate(45 100 180)"
      />

      {/* Labels */}
      <text x="100" y="40" textAnchor="middle" fill="black" fontSize="10">
        2B
      </text>
      <text x="160" y="100" textAnchor="middle" fill="black" fontSize="10">
        1B
      </text>
      <text x="40" y="100" textAnchor="middle" fill="black" fontSize="10">
        3B
      </text>
      <text x="100" y="165" textAnchor="middle" fill="black" fontSize="10">
        Home
      </text>
    </svg>
  );
};

export default BaseballDiamond;
