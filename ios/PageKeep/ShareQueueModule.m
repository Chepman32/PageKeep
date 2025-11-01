#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import "PageKeep-Swift.h"

static NSString *ShareQueueNotificationIdentifier(void) {
  return [ShareQueue notificationIdentifier];
}

@interface ShareQueueModule : RCTEventEmitter <RCTBridgeModule>
@end

@implementation ShareQueueModule {
  BOOL hasListeners;
}

RCT_EXPORT_MODULE();

- (instancetype)init {
  if ((self = [super init])) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleShareNotification)
                                                 name:[ShareQueue notificationIdentifier]
                                               object:nil];
  }
  return self;
}

- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (NSArray<NSString *> *)supportedEvents {
  return @[ ShareQueueNotificationIdentifier() ];
}

- (void)startObserving {
  hasListeners = YES;

  NSArray *items = [ShareQueue consumeAll];
  if (items.count > 0) {
    [self sendEventWithName:ShareQueueNotificationIdentifier() body:items];
  }
}

- (void)stopObserving {
  hasListeners = NO;
}

RCT_REMAP_METHOD(getPendingShares,
                 getPendingSharesWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSArray *items = [ShareQueue consumeAll];
  if (items == nil) {
    resolve(@[]);
  } else {
    resolve(items);
  }
}

RCT_EXPORT_METHOD(clearQueue)
{
  [ShareQueue clear];
}

- (void)handleShareNotification {
  if (!hasListeners) {
    return;
  }

  NSArray *items = [ShareQueue consumeAll];
  if (items.count > 0) {
    [self sendEventWithName:ShareQueueNotificationIdentifier() body:items];
  }
}

@end
