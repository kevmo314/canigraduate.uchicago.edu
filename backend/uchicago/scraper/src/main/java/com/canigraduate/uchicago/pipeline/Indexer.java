package com.canigraduate.uchicago.pipeline;

import com.canigraduate.uchicago.models.Section;
import com.canigraduate.uchicago.pipeline.firestore.FirestoreGetSectionsDoFn;
import com.canigraduate.uchicago.pipeline.indexing.CardinalityIndexer;
import com.canigraduate.uchicago.pipeline.indexing.InstructorsIndexer;
import com.canigraduate.uchicago.pipeline.indexing.KeyIndexer;
import com.canigraduate.uchicago.pipeline.models.Key;
import com.canigraduate.uchicago.pipeline.transforms.FirestoreCourseKeysTransform;
import com.canigraduate.uchicago.pipeline.transforms.FirestoreListSectionsTransform;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PBegin;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PDone;

public class Indexer extends PTransform<PBegin, PDone> {

    public static void main(String[] args) {
        Pipeline p = DataflowPipeline.create("uchicago-indexer");
        p.apply(new Indexer());
        p.run().waitUntilFinish();
    }

    @Override
    public PDone expand(PBegin input) {
        Pipeline p = input.getPipeline();

        PCollection<Key> courseKeys = p.apply(new FirestoreCourseKeysTransform());
        PCollection<KV<Key, Iterable<String>>> sectionIds = courseKeys.apply(new FirestoreListSectionsTransform());
        PCollection<KV<Key, Section>> sections = sectionIds.apply(ParDo.of(new FirestoreGetSectionsDoFn()));

        sectionIds.apply("Build cardinality index", CardinalityIndexer.of("cardinality"));
        courseKeys.apply("Build department index", KeyIndexer.of("departments", Key::getDepartment));
        courseKeys.apply("Build periods index", KeyIndexer.of("periods", key -> key.getTerm().getPeriod()));
        courseKeys.apply("Build years index", KeyIndexer.of("years", key -> String.valueOf(key.getTerm().getYear())));
        courseKeys.apply("Build terms index", KeyIndexer.of("terms", key -> key.getTerm().getTerm()));
        sections.apply("Build instructors index", InstructorsIndexer.of("instructors"));

        return PDone.in(p);
    }
}
