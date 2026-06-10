const { Review, DrivingSchool } = require('../models');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');

class ReviewService {
    async create(reviewerId, { schoolId, rating, comment = '' }) {
        const school = await DrivingSchool.findById(schoolId);
        if (!school || school.status !== 'active') {
            throw new ApiError(404, ERR.SCHOOL_NOT_FOUND);
        }

        try {
            return await Review.create({
                reviewerId,
                schoolId,
                rating,
                comment,
                adminStatus: 'pending',
            });
        } catch (err) {
            if (err.code === 11000) throw new ApiError(409, ERR.REVIEW_EXISTS);
            throw err;
        }
    }

    async listBySchool(schoolId, query = {}) {
        const filter = { schoolId, adminStatus: 'approved' };
        if (query.minRating) filter.rating = { $gte: Number(query.minRating) };
        return Review.find(filter)
            .populate('reviewerId', 'name')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
    }

    async listPending() {
        return Review.find({ adminStatus: 'pending' })
            .populate('reviewerId', 'name email')
            .populate('schoolId', 'name')
            .sort({ createdAt: -1 })
            .lean();
    }

    async moderate(reviewId, moderatorId, { adminStatus }) {
        const review = await Review.findById(reviewId);
        if (!review) throw new ApiError(404, ERR.REVIEW_NOT_FOUND);

        review.adminStatus = adminStatus;
        review.moderatedBy = moderatorId;
        review.moderatedAt = new Date();
        await review.save();

        return review;
    }
}

module.exports = new ReviewService();
