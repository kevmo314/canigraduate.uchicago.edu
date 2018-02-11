package com.canigraduate.uchicago.pipeline;

import org.apache.beam.sdk.testing.PAssert;
import org.apache.beam.sdk.testing.TestPipeline;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.values.PCollection;
import org.junit.jupiter.api.Test;

public class ScraperTest {
    @Test
    public void subtract() {
        TestPipeline p = TestPipeline.create().enableAbandonedNodeEnforcement(false);
        PCollection<Integer> a = p.apply("Create Minuend", Create.of(1, 2, 3, 4, 5, 5));
        PCollection<Integer> b = p.apply("Create Subtrahend", Create.of(2, 3, 4, 6, 7, 8));
        PAssert.that(Scraper.subtract(a, b)).containsInAnyOrder(1, 5);
        p.run();
    }
}
