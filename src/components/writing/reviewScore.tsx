import React, { FC } from "react";
import { FaStar, FaStarHalf } from "react-icons/fa";

interface ReviewScoreProps {
  score: number;
}

export const ReviewScore: FC<ReviewScoreProps> = ({ score }) => {
  // Ensure the rating is within the valid range (0-5)
  const clampedRating = Math.max(0, Math.min(5, score));

  // Calculate the number of full stars, half stars, and empty stars
  const fullStars = Math.floor(clampedRating);
  const hasHalfStar = clampedRating - fullStars >= 0.5;
  const emptyStars = 5;

  return (
    <div className="relative flex items-center">
      <div className={"absolute flex"}>
        {[...Array(fullStars)].map((_, index) => (
          <FaStar
            size={12}
            key={`full-star-${index}`}
            className="text-sky-300"
          />
        ))}

        {hasHalfStar && <FaStarHalf size={12} className="text-sky-300" />}
      </div>

      {[...Array(emptyStars)].map((_, index) => (
        <FaStar
          size={12}
          key={`empty-star-${index}`}
          className="text-neutral-200"
        />
      ))}
    </div>
  );
};
