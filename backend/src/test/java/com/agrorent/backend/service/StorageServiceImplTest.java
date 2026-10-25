package com.agrorent.backend.service;

import com.agrorent.backend.service.impl.StorageServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.web.multipart.MultipartFile;

import java.util.Iterator;
import java.util.function.Consumer;
import java.util.function.Supplier;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StorageServiceImplTest {

    @Mock
    private ImageStorageService cloudinaryStorage;

    @Mock
    private ImageStorageService localStorage;

    @Mock
    private MultipartFile mockFile;

    private static class StubObjectProvider implements ObjectProvider<ImageStorageService> {
        private final ImageStorageService delegate;
        private int invocationCount = 0;

        StubObjectProvider(ImageStorageService delegate) {
            this.delegate = delegate;
        }

        int getInvocationCount() {
            return invocationCount;
        }

        @Override
        public ImageStorageService getObject() throws BeansException {
            invocationCount++;
            return delegate;
        }

        @Override
        public ImageStorageService getObject(Object... args) throws BeansException {
            return getObject();
        }

        @Override
        public ImageStorageService getIfAvailable() throws BeansException {
            return delegate;
        }

        @Override
        public ImageStorageService getIfAvailable(Supplier<ImageStorageService> defaultSupplier) throws BeansException {
            return delegate;
        }

        @Override
        public void ifAvailable(Consumer<ImageStorageService> dependencyConsumer) throws BeansException {
            dependencyConsumer.accept(delegate);
        }

        @Override
        public ImageStorageService getIfUnique() throws BeansException {
            return delegate;
        }

        @Override
        public ImageStorageService getIfUnique(Supplier<ImageStorageService> defaultSupplier) throws BeansException {
            return delegate;
        }

        @Override
        public void ifUnique(Consumer<ImageStorageService> dependencyConsumer) throws BeansException {
            dependencyConsumer.accept(delegate);
        }

        @Override
        public Iterator<ImageStorageService> iterator() {
            return Stream.of(delegate).iterator();
        }

        @Override
        public Stream<ImageStorageService> stream() {
            return Stream.of(delegate);
        }

        @Override
        public Stream<ImageStorageService> orderedStream() {
            return Stream.of(delegate);
        }
    }

    @Test
    @DisplayName("When Cloudinary is configured, StorageServiceImpl must use Cloudinary and never instantiate LocalStorage")
    void whenCloudinaryConfigured_shouldUseCloudinaryAndNeverInstantiateLocalStorage() {
        when(cloudinaryStorage.isCloudStorageConfigured()).thenReturn(true);
        when(cloudinaryStorage.storeImage(mockFile)).thenReturn("https://res.cloudinary.com/demo/image/upload/v1/tractor.jpg");

        StubObjectProvider stubProvider = new StubObjectProvider(localStorage);
        StorageServiceImpl storageService = new StorageServiceImpl(cloudinaryStorage, stubProvider);

        assertTrue(storageService.isCloudStorageConfigured());

        String resultUrl = storageService.storeImage(mockFile);
        assertEquals("https://res.cloudinary.com/demo/image/upload/v1/tractor.jpg", resultUrl);

        storageService.deleteImage("https://res.cloudinary.com/demo/image/upload/v1/tractor.jpg");
        verify(cloudinaryStorage).deleteImage("https://res.cloudinary.com/demo/image/upload/v1/tractor.jpg");

        // CRITICAL: LocalStorageService must never be instantiated or accessed
        assertEquals(0, stubProvider.getInvocationCount());
        verifyNoInteractions(localStorage);
    }

    @Test
    @DisplayName("When Cloudinary is not configured, StorageServiceImpl must fallback to LocalStorage on-demand and cache it")
    void whenCloudinaryNotConfigured_shouldFallbackToLocalStorageAndCache() {
        when(cloudinaryStorage.isCloudStorageConfigured()).thenReturn(false);
        when(localStorage.storeImage(mockFile)).thenReturn("/api/uploads/equipment/local_123.jpg");

        StubObjectProvider stubProvider = new StubObjectProvider(localStorage);
        StorageServiceImpl storageService = new StorageServiceImpl(cloudinaryStorage, stubProvider);

        assertFalse(storageService.isCloudStorageConfigured());

        // First call should retrieve LocalStorage from provider
        String resultUrl1 = storageService.storeImage(mockFile);
        assertEquals("/api/uploads/equipment/local_123.jpg", resultUrl1);

        // Second call should reuse cached instance without re-querying provider
        storageService.deleteImage("/api/uploads/equipment/local_123.jpg");
        verify(localStorage).deleteImage("/api/uploads/equipment/local_123.jpg");

        assertEquals(1, stubProvider.getInvocationCount());
    }

    @Test
    @DisplayName("Overloaded direct constructor should route correctly for tests")
    void overloadedConstructor_shouldRouteDirectly() {
        when(cloudinaryStorage.isCloudStorageConfigured()).thenReturn(true);
        StorageServiceImpl storageService = new StorageServiceImpl(cloudinaryStorage, localStorage);

        assertTrue(storageService.isCloudStorageConfigured());

        when(cloudinaryStorage.isCloudStorageConfigured()).thenReturn(false);
        StorageServiceImpl storageServiceFallback = new StorageServiceImpl(cloudinaryStorage, localStorage);
        assertFalse(storageServiceFallback.isCloudStorageConfigured());
    }
}
