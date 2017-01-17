/**
 * Generic course specification interface.
 */
export type Base = {
    /** The name to display for this institution. */
    name: string,
    /** The CSS class to use for theming. */
    theme: string,
    /** An enum enumerating the terms (eg semesters, quarters) that this institution uses. */
    terms: any,
    /**
     * Get the department of a given course id string.
     * @param id The course id to identify.
     * @returns The department of the given course.
     */
    getDepartment(id: string): string;
    /**
     * Get the numerical ordinal value of a non-wildcard course.
     * @param id The non-wildcard course id to identify.
     * @returns The number of the course.
     */
    getOrdinal(id: string): number;
    /**
     * Check if a given id is a wildcard course. A wildcard course is guaranteed
     * to have a well-formed department.
     * For example, "MATH 2" is a wildcard course for UChicago
     * that matches all MATH 2xxxx coursees.
     * @param id The course id to check.
     * @returns True if the id does not represent a unique course.
     */
    isWildcard(id: string): boolean;
    /**
     * Get a padded wildcard string. For example, "MATH 2" => "MATH 2xxxx".
     * @param id The wildcard id to pad.
     * @returns The padded version.
     */
    getPaddedWildcard(id: string): string;
    /**
     * Check if a given string is a valid course identifier or wildcard identifier.
     * @param id The course id to check.
     * @returns True if the id appears valid.
     */
    isValid(id: string): boolean;
};