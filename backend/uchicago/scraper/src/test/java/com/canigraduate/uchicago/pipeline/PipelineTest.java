package com.canigraduate.uchicago.pipeline;

import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.testing.TestPipeline;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;

public abstract class PipelineTest {
    protected Pipeline pipeline;

    @BeforeEach
    public void beforeEach() {
        this.pipeline = TestPipeline.create().enableAbandonedNodeEnforcement(false);
        this.pipeline.getCoderRegistry().registerCoderProvider(new ModelSubtypeCoderProvider());
    }

    @AfterEach
    public void afterEach() {
        this.pipeline.run();
    }
}
