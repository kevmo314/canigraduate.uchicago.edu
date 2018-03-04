package com.canigraduate.uchicago.pipeline.coders;

import com.canigraduate.uchicago.models.Schedule;
import com.google.common.collect.ImmutableSet;
import org.apache.beam.sdk.coders.BigEndianLongCoder;
import org.apache.beam.sdk.coders.Coder;
import org.apache.beam.sdk.coders.CustomCoder;
import org.apache.beam.sdk.coders.SetCoder;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Set;

public class ScheduleCoder extends CustomCoder<Schedule> {
    private static final Coder<Set<Schedule.Block>> BLOCK_CODER = SetCoder.of(BlockCoder.of());


    public static ScheduleCoder of() {
        return new ScheduleCoder();
    }

    @Override
    public void encode(Schedule value, OutputStream outStream) throws IOException {
        BLOCK_CODER.encode(value.getBlocks(), outStream);
    }

    @Override
    public Schedule decode(InputStream inStream) throws IOException {
        return Schedule.create(ImmutableSet.copyOf(BLOCK_CODER.decode(inStream)));
    }

    static class BlockCoder extends CustomCoder<Schedule.Block> {
        private static final BigEndianLongCoder BIG_ENDIAN_LONG_CODER = BigEndianLongCoder.of();

        private BlockCoder() {
        }

        static BlockCoder of() {
            return new BlockCoder();
        }

        @Override
        public void encode(Schedule.Block value, OutputStream outStream) throws IOException {
            BIG_ENDIAN_LONG_CODER.encode(value.toLong(), outStream);
        }

        @Override
        public Schedule.Block decode(InputStream inStream) throws IOException {
            return Schedule.Block.fromLong(BIG_ENDIAN_LONG_CODER.decode(inStream));
        }
    }
}