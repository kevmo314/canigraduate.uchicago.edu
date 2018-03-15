package com.canigraduate.uchicago.pipeline;

import com.canigraduate.uchicago.ServiceAccountCredentials;
import org.apache.beam.runners.dataflow.DataflowRunner;
import org.apache.beam.runners.dataflow.options.DataflowPipelineOptions;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.options.PipelineOptionsFactory;

public class DataflowPipeline {
    public static Pipeline create(String jobName) {
        DataflowPipelineOptions dataflowOptions = PipelineOptionsFactory.create().as(DataflowPipelineOptions.class);
        dataflowOptions.setRunner(DataflowRunner.class);
        dataflowOptions.setJobName(jobName);
        dataflowOptions.setProject("canigraduate-43286");
        dataflowOptions.setTempLocation("gs://uchicago/dataflow-temp");
        dataflowOptions.setGcpCredential(
                new ServiceAccountCredentials("https://www.googleapis.com/auth/cloud-platform").getCredentials());
        dataflowOptions.setMaxNumWorkers(100);
        dataflowOptions.setRegion("us-central1");

        Pipeline p = Pipeline.create(dataflowOptions);
        p.getCoderRegistry().registerCoderProvider(new ModelSubtypeCoderProvider());
        return p;
    }
}
