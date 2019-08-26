/**
 * @noSelfInFile
 */

const f = CreateFrame('Frame', null, UIParent)

const whitelist: { [item: string]: boolean } = {
  'Strider Meat': true,
};

function sellItems() {
  if (!MerchantFrame.IsShown()) {
    return;
  }

  for (let bag = 0; bag <= NUM_BAG_SLOTS; bag++) {
    for (let slot = 0; slot <= GetContainerNumSlots(bag); slot++) {
      const itemLink = GetContainerItemLink(bag, slot);

      if (itemLink) {
        const [itemName, , rarity, , , , subType] = GetItemInfo(itemLink);

        let unusableItem: boolean;
        let commonEquippableItem = rarity === 1 && IsEquippableItem(itemLink);

        if (commonEquippableItem) {
          GameTooltip.SetOwner(UIParent, 'ANCHOR_NONE');
          GameTooltip.SetHyperlink(itemLink);
          GameTooltip.Show();

          let tooltipText: WoWAPI.FontInstance;
          for (let line = 1; line < GameTooltip.NumLines(); line++) {
            tooltipText = _G[`GameTooltipTextRight${line}`];
            if (tooltipText) {
              const text = tooltipText.GetText();

              if (text && string.find(subType, text)[0]) {
                const [r, g, b] = tooltipText.GetTextColor();

                if (r > .9 && b < .13 && g < .13) {
                  unusableItem = true;
                }
              }
            }
          }
        }

        if (rarity === 0 || unusableItem || whitelist[itemName]) {
          UseContainerItem(bag, slot);
        }
      }
    }
  }
}

f.MERCHANT_SHOW = function(this: typeof f) {
  const [, canRepair] = GetRepairAllCost();

  if (canRepair) {
    RepairAllItems();
  }

  sellItems();
};

f.MODIFIER_STATE_CHANGED = function(this: typeof f, _event: string, key: string, state: number) {
  if (key === 'LCTRL' && state === 1) {
    let lastPrice: number;
    let bagNum: number;
    let slotNum: number;
    for (let bag = 0; bag < NUM_BAG_SLOTS; bag++) {
      if (IsBagOpen(bag)) {
	for (let bagSlot = 1; bagSlot <= GetContainerNumSlots(bag); bagSlot++) {
          const itemid = GetContainerItemID(bag, bagSlot);
	  if (itemid) {
	    const [, , itemRarity, , , , , , , , vendorPrice] = GetItemInfo(itemid);
	    if (itemRarity === 0 && vendorPrice > 0) {
	      const [, itemCount] = GetContainerItemInfo(bag, bagSlot);
	      const totalVendorPrice = vendorPrice * itemCount;
	      if (!lastPrice) {
	        lastPrice = totalVendorPrice;
	        bagNum = bag;
	        slotNum = bagSlot;
	      } else if (lastPrice > totalVendorPrice) {
	        lastPrice = totalVendorPrice
	        bagNum = bag
	        slotNum = bagSlot
	      }
            }
          }
        }
      }
    }

    if (bagNum && slotNum) {
      for (let i = 1; i <= NUM_CONTAINER_FRAMES; i++) {
        const frame = _G[`ContainerFrame${i}`];
        if (frame.GetID() === bagNum && frame.IsShown()) {
          const item = _G[`ContainerFrame${i}Item${GetContainerNumSlots(bagNum) + 1 - slotNum}`];
          if (item) {
            item.NewItemTexture.SetAtlas('bags-glow-orange');
	    item.NewItemTexture.Show();
	    item.flashAnim.Play();
	    item.newitemglowAnim.Play();

            break;
          }
        }
      }
    }
  }
};

f.Show();

f.RegisterEvent('MERCHANT_SHOW');
f.RegisterEvent('MODIFIER_STATE_CHANGED');

const onEvent = function(this: typeof f, event: string, ...args: Vararg<any>) {
  return this[event](event, ...args);
};

f.SetScript('OnEvent', onEvent);


function SetGameToolTipPrice(tt: WoWAPI.GameTooltip) {
  if (!MerchantFrame.IsShown()) {
    const [, itemLink] = tt.GetItem();
    if (itemLink) {
      const [, , , , , , , , , , itemSellPrice] = GetItemInfo(itemLink);
      if (itemSellPrice && itemSellPrice > 0) {
        const container = GetMouseFocus();
        const object = container.GetObjectType();
        let count: number;
        if (object === 'Button') {
          count = container.count;
        } else if (object === 'CheckButton') {
          count = container.count || tonumber(container.Count.GetText());
        }
        const cost = (typeof count === 'number' && count || 1) * itemSellPrice;

        SetTooltipMoney(tt, cost, null, SELL_PRICE_TEXT);
      }
    }
  }
}


function SetItemRefToolTipPrice(tt: any) {
  const [, itemLink] = tt.GetItem();
  if (itemLink) {
    const [, , , , , , , , , , itemSellPrice] = GetItemInfo(itemLink);
    if (itemSellPrice && itemSellPrice > 0) {
      SetTooltipMoney(tt, itemSellPrice, null, SELL_PRICE_TEXT);
    }
  }
}


GameTooltip.HookScript('OnTooltipSetItem', SetGameToolTipPrice)
ItemRefTooltip.HookScript('OnTooltipSetItem', SetItemRefToolTipPrice)
